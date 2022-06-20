"use strict";

class Bank {
  constructor() {
    this.clients = [];
  }
  
  addClient(clientInformation) {
    let client = new Client(clientInformation);
    this.clients.push(client);
    return client;
  }
  searchClient(identificationСode) {
    let client = this.clients.find(client => client.identificationСode === identificationСode);
    return client;
  }
  openAccount(identificationСode, information, balance, limit, personalFunds) {
    let client = this.searchClient(identificationСode);
    let account;
    if(limit === undefined) {
      account = new DebitAccount(information, balance);
      client.debitAccounts.push(account);
    } else {
      account = new CreditAccount(information,balance,limit,personalFunds);
      client.creditAccounts.push(account);
    }
  }
  searchAccounts(arrayClients, accountsType, accountСharacteristics, callback) {
    let accounts = [];
    for(let i = 0; i < arrayClients.length; i++) {
      let client = arrayClients[i];
      for(let key in client) {
        if(key === accountsType && client[key].length !== 0 ) {
          for(let j = 0; j < client[key].length; j++) {
            let account = client[accountsType][j];
            for(let property in account) {
              if(property === accountСharacteristics) {
                if(callback(account[property])) {
                  accounts.push(account);
                }
              }
            }
          }
        }
      }
    }
    return accounts;
  }
  searchClients(clientInformation, callback) {
    let clients = [];
    for(let i = 0; i < this.clients.length; i++) {
      let client = this.clients[i];
      for(let key in client) {
        if(key === clientInformation){
          if(callback(client[key])) {
            clients.push(client);
          }
        }
      }
    }
    return clients;
  }
  getСurrentExchangeRate() {
    let exchangeRate = fetch("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5")
    .then(response => response.json())
    .then(result => {
      let  rates = [];
      result.forEach(item => {
        rates.push(item);
      });
      return rates
    })
    .catch(error => console.error(error));
    return exchangeRate;
  }
  async convertBalansOneCurrency(accounts, toCurrency, key = 'currencyType', balance = 'balance') {
    let convertAccounts = [];
    for(let i = 0; i < accounts.length; i++) {
      let account = accounts[i];
      if(account[key] !== toCurrency) {
        await this.getСurrentExchangeRate()
        .then(result => {
          let rate = result.find(item => item.base_ccy === account[key] && item.ccy === toCurrency);
          account[balance] =  account[balance] / rate.sale;
          account[key] = toCurrency;
          convertAccounts.push(account);
        })
      } else {
        convertAccounts.push(account);
      }
    }
    return convertAccounts;
  }
  sumBalance(accounts, key = 'balance') {
    let amount = 0;
    for(let i = 0; i < accounts.length; i++) {
      let account = accounts[i];
      amount += account[key];
    }
    return amount;
  }
  async calcAllMoneyDollars() {
    let debitAccounts = this.searchAccounts(this.clients, 'debitAccounts', 'balance', item => item > 0);
    let creditAccounts = this.searchAccounts(this.clients, 'creditAccounts', 'balance', item => item > 0 || item < 0);
    let convertDebitAccouts = await this.convertBalansOneCurrency(debitAccounts, "USD");
    let convertCreditAccounts = await this.convertBalansOneCurrency(creditAccounts, "USD");
    let sumDebetAccountsBalance = this.sumBalance(convertDebitAccouts);
    let sumCreditAccountsBalance = this.sumBalance(convertCreditAccounts);
    return sumDebetAccountsBalance + sumCreditAccountsBalance;
  }
  async calcAllDebtDollars() {
    let creditAccounts = this.searchAccounts(this.clients, 'creditAccounts', 'balance', item => item < 0);
    let convertCreditAccounts = await this.convertBalansOneCurrency(creditAccounts, "USD");
    return this.sumBalance(convertCreditAccounts);
  }
  async calcDebtDollarsActiveClients() {
    let activeClients = this.searchClients('active', item => item === true);
    let amountActive = activeClients.length;
    let creditAccounts = this.searchAccounts(activeClients, 'creditAccounts', 'balance', item => item < 0);
    let convertCreditAccounts = await this.convertBalansOneCurrency(creditAccounts, "USD");
    let sumBalance = this.sumBalance(convertCreditAccounts);
    return `Долг ${amountActive} активных Клиентов составляет ${-(sumBalance)} долларов`;
  }
  
  async calcDebtDollarsNotActiveClients() {
    let notActiveClients = this.searchClients('active', item => item === false);
    let amountNotActive = notActiveClients.length;
    let creditAccounts = this.searchAccounts(notActiveClients, 'creditAccounts', 'balance', item => item < 0);
    let convertCreditAccounts = await this.convertBalansOneCurrency(creditAccounts, "USD");
    let sumBalance = this.sumBalance(convertCreditAccounts);
    return `Долг ${amountNotActive} неактивных Клиентов составляет ${-(sumBalance)} долларов`;
  }
}

class Client {
  constructor(clientInformation) {
    this.identificationСode = clientInformation.identificationСode;
    this.name = clientInformation.name;
    this.active = clientInformation.active;
    this.registrationDate = new Date();
    this.debitAccounts = [];
    this.creditAccounts = [];
  }
}

class Accounts {
  constructor(information) {   
    this.activeAccount = information.activeAccount;
    this.cardExpiryDate = information.cardExpiryDate;
    this.currencyType = information.currencyType;
  }
}

class DebitAccount extends Accounts {
  constructor(information, balance) {
    super(information);
    this.balance = balance || 0;
  }
}

class CreditAccount extends Accounts {
  constructor(information, personalFunds, limit, balance) {
    super(information);
    this.personalFunds = personalFunds;
    this.limit = limit;
    this.balance = this.personalFunds - this.limit;
  }
}













 


    

      

