import React, { Component } from 'react';
import './App.css';

import PropTypes from 'prop-types';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from 'recharts';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            portfolioList: [], // Will contain lists of portfolios created
            count: 0, //Assigns unique keys to portfolios
            value: '',
            show: false,
        };

    }
    //add a portfolio with n (name), i (ID), and b (increment count)
    addPortFolio(n,i,b){
        if(b){ //add portfolio in localstorage
            if (typeof localStorage["portfolioName"] === 'undefined'){
                var newArray1 = []; //New array of portfolio
            }else{
                newArray1 = JSON.parse(localStorage["portfolioName"]); //get array of portfolio from the localStorage
            }
            var s = [] ;//stocks list
            var k = 0; //countP
            var portfo = {i,n,s,k};
            newArray1.push(portfo);
            localStorage["portfolioName"] = JSON.stringify(newArray1);
            localStorage["k"] = this.state.count + 1
        }

        var newArray = this.state.portfolioList;
        newArray.push(<Portfolio id={i} name={n} onClick={() => this.delPortFolio(i)}/>);
        this.setState({portfolioList:newArray});
        var newCount = this.state.count;
        const newList = newCount +1;
        this.setState({count:newList});
        this.setState({show:false})
    }

    //Delete a portfolio using the ID key (i) and deleting it from the localstorage
    delPortFolio(i){
        alert("The portfolio will now be deleted");
        var portfolioName = JSON.parse(localStorage["portfolioName"]);
        for (var t = 0; t < portfolioName.length; t++) {
            if( portfolioName[t].i === i){
                portfolioName.splice(t,1)
            }
        }
        localStorage["portfolioName"] = JSON.stringify(portfolioName);


        var newArray = this.state.portfolioList;
        for (var j = 0; j < newArray.length; j++) {
            if(newArray[j].props.id === i){
                newArray.splice(j,1)
            }
        }
        this.setState({portfolioList:newArray})
    }

    //Input name of portfolio
    handleChange(event) {
        this.setState({value: event.target.value});
    }

    componentWillMount(){
        if(localStorage["k"]){
            var context = JSON.parse(localStorage["k"]);
            this.setState({count:context})
        }
    }

    componentDidMount(){
        if(localStorage["portfolioName"] && localStorage["k"]){
            var portfolioName = JSON.parse(localStorage["portfolioName"]);

            for (var portfo in portfolioName) {
                //add all already existing portfolio from the local storage
                this.addPortFolio(portfolioName[portfo].n,portfolioName[portfo].i,false)
            }
        }
    }


    render() {
        return (
            <div>
                <div className="Header">
                    <div className={"Header-title"}>
                        <span>Stock Portfolio Management System</span>
                    </div>
                </div>
                {/* maximum number of portfolio is 10 */}
                {this.state.portfolioList.length < 10 &&
                <button type="button" className="AddPortfolioBtn"
                        onClick={() => this.setState({show:true}) }> Add new Portfolio </button>}
                {/* input text only shown when adding a new portfolio*/}
                {this.state.show &&
                <div>
                    <input type="text" placeholder="Portfolio name" value={this.state.value}
                           onChange={this.handleChange.bind(this)} />
                    <button onClick={() => this.addPortFolio(this.state.value,this.state.count,true)}>Validate</button>
                </div>
                }

                <div className={"Spacer"}/>
                <div className="Portfolio_container col-11 col-m-11 clearfix">
                    {this.state.portfolioList}
                </div>

            </div>
        );
    }

}

class Portfolio extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            id: null, //id of the portfolio
            name: null, //name of portfolio
            stockList: [], //list of stocks
            portName: '', //input text for the stock name
            portfolioQuantity: '', //input text for the stock quantity
            total: 0, //total amount of money in the portfolio
            currency: "$", //current currency displayed
            countP: 0, //local counter that has stock unique key
            show: false, //boolean not to show the input stock name and quantity
            currencyValue: null, //current currency change from $ to €
        };
    }

    //Adding the stocks to the stockList (n:name, q:quantity, v:value, t:totalAmount) and with a unique key
    addStock(n,q,v,t,a){
        var newArray = a;
        if(this.state.currency === "€"){
            v = v * this.state.currencyValue;
            t = v * q
        }
        var f = this.state.countP;
        newArray.push(<Stock key={this.state.countP} idStock={this.state.countP} name={n} quantity={q} value={v}
                             totalAmount={t} selected={false} onChange={() => this.selectStock(f)}/>);
        this.updateC();
        this.setState({stockList:newArray}, function() {
            var k = this.state.countP;
            const newList = k +1;
            this.setState({countP:newList});
            this.getTotalAmount()
        })
    }

    //Adding stocks to the array using the keys
    //a:array, k:key, n:name, q:quantity, v:value, t:totalAmount, s:selected, that:this
    //used in loops to avoid function in a loop warning
    addArray(a,k,n,q,v,t,s,that){
        return function(){
            a.push(<Stock key={k} idStock={k} name={n} quantity={q} value={v} totalAmount={t}
                          selected={s} onChange={() => that.selectStock(k)}/>)
        }
    }

    //https request to get the latest currency change
    getLatestValue(){
        var that = this;
        var client = new XMLHttpRequest();
        client.open("GET",
            "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey=8EJF6T5NRPCXT944", true);
        client.onreadystatechange = function() {
            if(client.readyState === 4) {
                var obj = JSON.parse(client.responseText);
                var currencyChange = obj["Realtime Currency Exchange Rate"]["5. Exchange Rate"];
                that.setState({currencyValue:currencyChange})
            }
        };
        client.send();
    }

    //http request to add a stock. n: stock name.
    //get the current value in $ and calculate the total value using q:quantity
    add(n,q,a,b){
        this.setState({show:false});
        var that = this;
        var array = a;
        var client = new XMLHttpRequest();
        client.open("GET",
            "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + n +
            "&interval=1min&apikey=8EJF6T5NRPCXT944", true);
        client.onreadystatechange = function() {
            if(client.readyState === 4) {
                var obj = JSON.parse(client.responseText);
                var count = 0;
                var t;
                for (t in obj){
                    if (count === 1) {
                        var temp = obj[t]
                    }
                    count++
                }
                count = 0;

                for (t in temp){
                    if(count === 0){
                        const val = temp[t]["4. close"];
                        const tot = val * q;
                        that.addStock(n,q,val,tot,array);


                        if(b){ //add the stock to the corresponding portfolio in the local storage
                            var portfolioName = JSON.parse(localStorage["portfolioName"]);
                            for( var portfo in portfolioName){
                                if(portfolioName[portfo].i === that.props.id){
                                    var stockName = n;
                                    var stockQuantity = q;
                                    portfolioName[portfo].s.push({stockName,stockQuantity})
                                }
                            }
                            localStorage["portfolioName"] = JSON.stringify(portfolioName);
                        }


                    }count++
                }
                count =0
            }
        };
        client.send();
    }

    //Input stock name
    handleChangeN(event) {
        this.setState({portName: event.target.value});
    }
    //Input stock quantity
    handleChangeQ(event) {
        this.setState({portfolioQuantity: event.target.value});
    }

    //Selecting a stock in a list using the unique ID
    selectStock(uniqueID){
        var func;
        var newArray = this.state.stockList;
        var j;
        for (var i = 0; i < this.state.stockList.length; i++) {
            if(this.state.stockList[i].props.idStock === uniqueID){
                //if the stock is found, a new one with the same attributes except its selected attribute is added in the stock list
                func = this.addArray(newArray,this.state.countP,this.state.stockList[i].props.name,
                    this.state.stockList[i].props.quantity,
                    this.state.stockList[i].props.value,this.state.stockList[i].props.totalAmount,
                    !this.state.stockList[i].props.selected,this);
                j=i
            }
        }
        func();//call the addArray function after the loop
        newArray.splice(j,1);//delete the old stock
        this.setState({stockList:newArray});
        var k = this.state.countP;
        const newList = k +1;
        this.setState({countP:newList});
        this.getTotalAmount();
        var portfolioName = JSON.parse(localStorage["portfolioName"]); //Array request from the local storage
        for( var m = 0; m < portfolioName.length; m++){
            if(portfolioName[m].i === this.props.id){
                portfolioName[m].k++
            }
        }
        localStorage["portfolioName"] = JSON.stringify(portfolioName);
    }

    //Remove selected stock from portfolio
    removeSelected(){
        alert("The selected stock will be removed now");
        var funcArray =[]; //array of function
        var newArray = [] ;//new stock list
        var counter = this.state.countP;
        for (var i = 0; i < this.state.stockList.length; i++) {
            if(!this.state.stockList[i].props.selected){
                //each stock is pushed in a newArray if it is not selected
                funcArray.push(this.addArray(newArray,counter,this.state.stockList[i].props.name,this.state.stockList[i].props.quantity,
                    this.state.stockList[i].props.value,this.state.stockList[i].props.totalAmount,
                    this.state.stockList[i].props.selected,this))
            }else{
                var portfolioName = JSON.parse(localStorage["portfolioName"]); //get array of portfolio from the localStorage
                for( var m = 0; m < portfolioName.length; m++){
                    if(portfolioName[m].i === this.props.id){
                        for(var t = 0; t < portfolioName[m].s.length; t++){
                            if(portfolioName[m].s[t].stockName === this.state.stockList[i].props.name &&
                                portfolioName[m].s[t].stockQuantity === this.state.stockList[i].props.quantity){
                                //delete selected stocks from the localstorage
                                portfolioName[m].s.splice(t,1)
                            }
                        }
                    }
                }
                localStorage["portfolioName"] = JSON.stringify(portfolioName);
            }
            counter++
        }
        for (var j = 0; j < funcArray.length; j++) {
            funcArray[j]() //call all the addArray calls of the previous loop
        }
        this.updateC();
        this.setState({stockList:newArray},function(){
            this.setState({countP:counter});
            this.getTotalAmount()
        })
    }

    //Stock values and total stock changes to dollars
    stockInDollar(){
        if(this.state.currency === "€"){
            this.setState({currency:"$"});
            var counter = this.state.countP;
            var newArray = [];
            var funcArray =[];
            for (var i = 0; i < this.state.stockList.length; i++) {
                var newValue = this.state.stockList[i].props.value / this.state.currencyValue;
                var newTotal = newValue * this.state.stockList[i].props.quantity;
                funcArray.push(this.addArray(newArray,counter,this.state.stockList[i].props.name,
                    this.state.stockList[i].props.quantity,newValue,newTotal,this.state.stockList[i].props.selected,this));
                counter++
            }
            for (var t = 0; t < funcArray.length; t++) {
                funcArray[t]()
            }
            this.updateC();
            this.setState({stockList:newArray},function(){
                this.setState({countP:counter});
                this.getTotalAmount()
            })
        }
    }

    //Stock values and total stock changes to euros
    stockInEuro(){
        if(this.state.currency === "$"){
            this.setState({currency:"€"});
            var counter = this.state.countP;
            var newArray = []; //new stocks list
            var funcArray =[]; //array of functions
            for (var i = 0; i < this.state.stockList.length; i++) {
                var newValue = this.state.stockList[i].props.value * this.state.currencyValue ;//new value (calculated with currency change)
                var newTotal = newValue * this.state.stockList[i].props.quantity; //newTotal value
                funcArray.push(this.addArray(newArray,counter,this.state.stockList[i].props.name,
                    this.state.stockList[i].props.quantity,newValue,newTotal,this.state.stockList[i].props.selected,this));
                counter++
            }
            for (var t = 0; t < funcArray.length; t++) {
                funcArray[t]()
            }
            this.updateC();
            this.setState({stockList:newArray},function(){
                this.setState({countP:counter});
                this.getTotalAmount()
            })
        }
    }

    //update countP in the localStorage
    updateC() {
        var portfolioName = JSON.parse(localStorage["portfolioName"]);
        for( var m = 0; m < portfolioName.length; m++){
            if(portfolioName[m].i === this.props.id){
                portfolioName[m].k ++
            }
        }
        localStorage["portfolioName"] = JSON.stringify(portfolioName);
    }

    //Update the total amount of the portfolio from the total amount of stocks
    getTotalAmount(){
        var stockInfo=0;
        for (var i = 0; i < this.state.stockList.length; i++) {
            stockInfo = stockInfo + this.state.stockList[i].props.totalAmount
        }
        this.setState({total:stockInfo})
    }

    componentWillMount(){
        var portfolioName = JSON.parse(localStorage["portfolioName"]);
        for( var m = 0; m < portfolioName.length; m++){
            if(portfolioName[m].i === this.props.id){
                //set countP to the countP of the localstorage
                this.setState({countP:portfolioName[m].k})
            }
        }
        localStorage["portfolioName"] = JSON.stringify(portfolioName);
    }

    componentDidMount(){
        this.getLatestValue(); //get currency change when mounting

        var portfolioName = JSON.parse(localStorage["portfolioName"]); //get array of requests from the localStorage
        for( var m = 0; m < portfolioName.length; m++){
            if(portfolioName[m].i === this.props.id){
                for(var t = 0; t < portfolioName[m].s.length; t++){
                    //add all the stocks from the corresponding portfolio from the localstorage
                    this.add(portfolioName[m].s[t].stockName,portfolioName[m].s[t].stockQuantity,this.state.stockList,false)
                }
            }
        }
        localStorage["portfolioName"] = JSON.stringify(portfolioName);
    }


    render() {
        return (
            <div className="Portfolio col- col-5 col-m-11">
                <div className="Portfolio-inner">
                    <span   className="Portfolio-title col- col-5 col-m-11">{this.props.name}</span>

                {/* input text and quantity only shown when adding a new stock*/}
                {this.state.show &&
                <div >
                    <input type="text" placeholder="Stock name" value={this.state.portName}
                           onChange={this.handleChangeN.bind(this)} />
                    <input type="text" placeholder="Quantity" value={this.state.portfolioQuantity}
                           onChange={this.handleChangeQ.bind(this)} />
                    <button onClick={() => this.add(this.state.portName,this.state.portfolioQuantity,
                        this.state.stockList,true)}>Validate</button>
                </div>
                }

                <div className="portfolio-btn">
                <button className="portfolio-euro" onClick={() => this.stockInEuro()}>Show in €</button>
                <button className="portfolio-dollar" onClick={() => this.stockInDollar()}>Show in $</button>
                <button className="portfolio-deleteBtn" onClick={() => this.props.onClick(this.props.id)}>X</button>
                 <br/>
                </div>

                <div className="Portfolio-content">
                <table width="500">
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Unit value</th>
                        <th>Quantity</th>
                        <th>Total value</th>
                        <th>Select</th>
                        <th>Perf Graph</th>
                    </tr>
                    </thead>
                    <tbody>
                    {this.state.stockList}
                    </tbody>
                </table>
                </div>
                <div>Total value of {this.props.name} : {this.state.total} {this.state.currency}</div><br/>
                {this.state.stockList.length < 50 &&
                <button onClick={() => this.setState({show:true})}>Add stock</button>}
                <button onClick={() => this.removeSelected()}>Remove selected</button>
                </div>
            </div>
        );
    }

}

class Stock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: null,
            idStock: null,
            totalAmount: 0,
            quantity: 0,
            value: 0,
            selected: false,
            isOpen: false, //open modal
        };
    }

    //open the modal
    toggleModal = () => {
        this.setState({
            isOpen: !this.state.isOpen
        });
    };


    render() {
        return (
            <tr >
                <td align= "center">{this.props.name}</td>
                <td align= "center">{this.props.value}</td>
                <td align= "center">{this.props.quantity}</td>
                <td align= "center">{this.props.totalAmount}</td>
                {/* checkbox to select and unselect this stock */}
                <td align= "center"><input type="checkbox" checked={this.props.selected}
                                           onChange={() => this.props.onChange(this.props.idStock)}/></td>
                <td align= "center"><button onClick={() => this.toggleModal()}>Graph</button></td>
                {/* Modal component */}
                <Modal stockname={this.props.name} show={this.state.isOpen}
                       onClose={this.toggleModal}>
                </Modal>

            </tr>

        );
    }
}

// Modal class that plot values over time of the stock
class Modal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [], //data that goes to the graph
            startDate: '',
            endDate: '',
            stockname: null,
            minDateAvailable: null, //oldest date available
            maxDateAvailable: null, //newest date available
        };
    }

    //v:values array d:dates array which goes to the graph
    stockData(v,d){
        var stockInfo = [];
        this.setState({minDateAvailable:d[d.length-1]}); //last date of the dates array
        this.setState({maxDateAvailable:d[0]});//first date of the dates array

        var f = d.length-1;
        var s = 0;

        if(this.state.startDate !== null && this.state.endDate !== null){
            for (var i = v.length-1; i >= 0; i--) {
                if(d[i] === this.state.startDate){
                    f = i //first date index
                }
                if(d[i] === this.state.endDate){
                    s = i //second date index
                }
            }
        }
        for (i = f; i >= s; i--) {
            //push (date,value) in stock Info array
            stockInfo.push({name: d[i], [this.props.stockname]:parseFloat(v[i])})
        }

        this.setState({data:stockInfo})
    }


    //daily value of the stock
    getStockData() {
        this.setState({show:false});
        var client = new XMLHttpRequest();
        var that = this;

        client.open("GET",
            "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + this.props.stockname +
            "&apikey=8EJF6T5NRPCXT944", true);
        client.onreadystatechange = function() {
            if(client.readyState === 4) {
                var obj = JSON.parse(client.responseText);
                var count = 0;
                var t;
                for (t in obj){
                    if (count === 1) {
                        var temp = obj[t]
                    }
                    count++
                }
                count = 0;

                var date = []; //date array
                var stockInfo = [];  //value array
                for (t in temp){
                    const val = temp[t]["4. close"];
                    stockInfo.push(val);
                    date.push(t);
                    count++
                }
                count =0;
                that.stockData(stockInfo,date)
            }
        };
        client.send();
    }

    //start date input
    handleChangeF(event) {
        this.setState({startDate: event.target.value});
    }

    //End date input
    handleChangeS(event) {
        this.setState({endDate: event.target.value});
    }

    componentDidMount(){
        this.getStockData()
    }

    render() {
        // Render nothing if the "show" prop is false
        if (!this.props.show) {
            return null;
        }


        // The modal window
        const modalStyle = {
            backgroundColor: '#fff',
            borderRadius: 5,
            maxWidth: 1500,
            minHeight: 600,
            margin: '0 auto',
            padding: 30
        };

        // Graph background
        const backdropStyle = {
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: 50
        };

        return (
            <div className="backdrop" style={backdropStyle}>
                <div className="modal" style={modalStyle}>
                    <input type="date" name="bday" value={this.state.startDate} onChange={this.handleChangeF.bind(this)}
                           min={this.state.minDateAvailable} max={this.state.maxDateAvailable}/>
                    <input type="date" name="bday" value={this.state.endDate} onChange={this.handleChangeS.bind(this)}
                           min={this.state.minDateAvailable} max={this.state.maxDateAvailable}/>

                    <button className="plotBtn" onClick={() => this.getStockData()}> Plot </button>
                    <br/>
                    <br/>

                    <div className="GraphWindow">
                        <LineChart width={1000} height={550} data={this.state.data}
                                   margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                            <XAxis dataKey="name"/>
                            <YAxis/>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <Tooltip/>
                            <Legend />
                            <Line type="monotone" dataKey={this.props.stockname} stroke="#8884d8" activeDot={{r: 8}}/>
                        </LineChart>
                    </div>
                    <div className="footer">
                        <button className="close" onClick={this.props.onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>

        )
    }
}


Modal.propTypes = {
    onClose: PropTypes.func.isRequired,
    show: PropTypes.bool,
};

export default App;
