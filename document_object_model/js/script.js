"use strict";
/*Вывести задания из раздела “Объекты” в HTML на страницу браузера. Создать формы добавления новых элементов, реализовать возможность удаления и изменения данных. */

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
    let activeClients = this.searchClients('active', item => item === 'активный');
    let amountActive = activeClients.length;
    let creditAccounts = this.searchAccounts(activeClients, 'creditAccounts', 'balance', item => item < 0);
    let convertCreditAccounts = await this.convertBalansOneCurrency(creditAccounts, "USD");
    let sumBalance = this.sumBalance(convertCreditAccounts);
    return `${amountActive}чел на сумму${-(sumBalance)}`;
  }
  
  async calcDebtDollarsNotActiveClients() {
    let notActiveClients = this.searchClients('active', item => item === 'неактивный');
    let amountNotActive = notActiveClients.length;
    let creditAccounts = this.searchAccounts(notActiveClients, 'creditAccounts', 'balance', item => item < 0);
    let convertCreditAccounts = await this.convertBalansOneCurrency(creditAccounts, "USD");
    let sumBalance = this.sumBalance(convertCreditAccounts);
    return `${amountNotActive}чел на сумму ${-(sumBalance)}`;
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

let bank, client, debetAccount, creditAccount, allMoney, allDebt, activeDebt, noActiveDebt, result;
renderHTML();
openBank();
openCard('.create_client_card', '.client_card');
openCard('.debet_account_card', '.debit_card');
openCard('.credit_account_card', '.credit_card');
openAllMoney();
openDebt();
openActive();
openNactive();
closeForm('form_client', '.close', '.client_card');
closeForm('form_debit', '.close_debet', '.debit_card');
closeForm('form_credit', '.close_credit', '.credit_card');
closeForm('form_all_money', '.close_all_money', '.all_card');
closeForm('form_debt', '.close_debt', '.debt_card');
closeForm('form_active', '.close_active', '.active_card');
closeForm('form_nactive', '.close_nactive', '.nactive_card');
addClient();
addDebitAccount();
addCreditAccount();

function renderHTML() {
  let body = document.querySelector('body');
  let divs = [];
  let buttons = [];
  let divsClass = ['container', 'open_bank', 'bank_container', 'create_client', 'debet_account', 'credit_account', 'all_money', 'all_debt', 'debt_active', 'debt_nactive' ];
  let buttonsClass = ['open', 'create_client_card', 'debet_account_card', 'credit_account_card', 'all_money_card', 'all_debt_card', 'debt_active_card', 'debt_nactive_card' ];
  let buttonsText = ['Открыть банк', 'Создать Клиента', 'Открыть дебетовый счет', 'Открыть кредитовый счет', 'Посчитать количество денег в банке (доллары)', 'Сумма задолженности(доллары)', 'Сумма задолженности Aктивныe Клиенты', 'Сумма задолженности Неактивные Клиенты'];
  
  for(let i = 0; i < divsClass.length; i++) {
    let div = document.createElement('div');
    div.setAttribute('class', divsClass[i]);
    div.classList.add('bank');
    divs.push(div);
  }
  body.appendChild(divs[0]);
  divs[0].appendChild(divs[1]);
  divs[0].appendChild(divs[2]);
  for(let i = 3; i < divs.length; i++) {
    divs[2].appendChild(divs[i]);
  }
  for(let i = 0; i < buttonsClass.length && i < buttonsText.length; i++) {
    let button = document.createElement('button');
    button.setAttribute('class', buttonsClass[i]);
    button.innerText = buttonsText[i];
    button.classList.add('btn');
    buttons.push(button);
  }
  divs[1].appendChild(buttons[0]);
  for(let i = 3; i < divs.length; i++) {
    divs[i].appendChild(buttons[i - 2]);
  }
  let divTable = document.createElement('div');
  divTable.setAttribute('style', 'overflow-x:auto;');
  divs[3].appendChild(divTable);
  let table = document.createElement('table');
  table.classList.add('table');
  divTable.appendChild(table);
  let tr = document.createElement('tr');
  table.appendChild(tr);
  let thInnerText = ['ИНН Клиента', 'Имя Клиента', 'Активность', 'Дата регистрации'];
  for(let i = 0; i < thInnerText.length; i++) {
    let th = document.createElement('th');
    th.innerText = thInnerText[i];
    th.classList.add('th');
    tr.appendChild(th);
  }
  function createForm(divParent, classDiv, idForm, inputsID, placeholders, buttonsClass, buttonsText) {
    let divForm = document.createElement('div');
    divForm.setAttribute('class', classDiv);
    divForm.classList.add('form-popup');
    let form = document.createElement('form');
    form.setAttribute('id', idForm);
    form.classList.add('form-container');
    for(let i = 0; i < inputsID.length; i++) {
      let label = document.createElement('label');
      form.appendChild(label);
      let input = document.createElement('input');
      input.setAttribute('id', inputsID[i]);
      input.setAttribute('placeholder', placeholders[i]);
      input.classList.add('input_form');
      form.appendChild(input);
    }
    divParent.appendChild(divForm);
    divForm.appendChild(form);
    for(let i = 0; i < buttonsText.length; i++) {
      let button = document.createElement('button');
      button.setAttribute('type', 'submit');
      button.setAttribute('class', buttonsClass[i]);
      button.innerText = buttonsText[i];
      button.classList.add('btn_form');
      form.appendChild(button);
    }
  }
  createForm(divs[3], 'client_card', 'form_client', ['id_inn', 'id_name', 'id_active'], ['Введите ИНН Клиента','Введите Имя Клиента', 'Активный/Неактивный'], ['add_client', 'close'], ['Добавить Клиента', 'Выйти']);
  createForm(divs[4], 'debit_card', 'form_debit', ['id_inn_client', 'id_active_debit', 'id_card_data_debit', 'id_currency_debit', 'id_balance_debit'], ['Введите ИНН Клиента','Активный или Неактивный счет', 'Срок действия карты', 'Тип валюты', 'Введите баланс'], ['add_debit_account', 'close_debet'], ['Добавить Счет Клиенту', 'Выйти']);
  createForm(divs[5], 'credit_card', 'form_credit', ['id_inn_client_credit', 'id_active_credit', 'id_card_data_credit', 'id_currency_credit', 'id_funds', 'limit'], ['Введите ИНН Клиента','Активный или Неактивный счет', 'Срок действия карты', 'Тип валюты', 'Личные средства', 'Лимит'], ['add_credit_account', 'close_credit'], ['Добавить Счет Клиенту', 'Выйти']);
  createForm(divs[6], 'all_card', 'form_all_money', ['id_amount_all'], [''], ['close_all_money'], ['Закрыть']);
  createForm(divs[7], 'debt_card', 'form_debt', ['id_debt'], [''], ['close_debt'], ['Закрыть']);
  createForm(divs[8], 'active_card', 'form_active', ['id_active'], [''], ['close_active'], ['Закрыть']);
  createForm(divs[9], 'nactive_card', 'form_nactive', ['id_nactive'], [''], ['close_nactive'], ['Закрыть']);
}
function openBank() {
  let button = document.querySelector('.open');
  let div = document.querySelector('.bank_container');
  button.addEventListener('click', function open() {
    div.style.display = 'block';
    bank = new Bank;
    button.removeEventListener('click', open);
  })
}
function openCard(buttonClass, divClass) {
  let button = document.querySelector(buttonClass);
  let div = document.querySelector(divClass);
  button.addEventListener('click', () => {
    div.style.display = 'block';
  })
}
function addClient() {
  let button = document.querySelector('.add_client');
  let div = document.querySelector('.client_card');
  let form = document.getElementById('form_client');
  let table = document.querySelector('.table');
  button.addEventListener('click', (event) => {
    event.preventDefault();
    let clientInformation = {
      identificationСode: '',
      name: '',
      active: '',
      registrationDate: new Date(),
      debitAccounts:[],
      creditAccounts: [],
    };
    clientInformation.identificationСode = document.getElementById('id_inn').value;
    clientInformation.name = document.getElementById('id_name').value;
    clientInformation.active = document.getElementById('id_active').value;
    console.log(clientInformation);
    client = bank.addClient(clientInformation);
    let tr = document.createElement('tr');
    tr.classList.add('tr');
    table.appendChild(tr);
    for(let key in clientInformation) {
      if(key == 'debitAccounts' && key == 'creditAccounts') {
        continue;
      }
      let td = document.createElement('td');
      tr.appendChild(td);
      td.classList.add('td');
      td.innerText = clientInformation[key];
    }
    div.style.display = 'none';
    form.reset();
  })
}
function addDebitAccount() {
  let button = document.querySelector('.add_debit_account');
  let div = document.querySelector('.debit_card');
  let form = document.getElementById('form_debit');
  button.addEventListener('click', (event) => {
    event.preventDefault();
    let information = {};
    information.activeAccount = document.getElementById('id_active_debit').value;
    information.cardExpiryDate = document.getElementById('id_card_data_debit').value;
    information.currencyType = document.getElementById('id_currency_debit').value;
    let identificationСode = document.getElementById('id_inn_client').value;
    let balance = document.getElementById('id_balance_debit').value;
    debetAccount = bank.openAccount(identificationСode, information, balance);
    div.style.display = 'none';
    form.reset();
  })
}
function addCreditAccount() {
  let button = document.querySelector('.add_credit_account');
  let div = document.querySelector('.credit_card');
  let form = document.getElementById('form_credit');
  button.addEventListener('click', (event) => {
    event.preventDefault();
    let information = {};
    information.activeAccount = document.getElementById('id_active_credit').value;
    information.cardExpiryDate = document.getElementById('id_card_data_credit').value;
    information.currencyType = document.getElementById('id_currency_credit').value;
    let identificationСode = document.getElementById('id_inn_client_credit').value;
    let limit = document.getElementById('limit').value;
    let personalFunds = document.getElementById('id_funds').value;
    let balance = personalFunds - limit;
    creditAccount = bank.openAccount(identificationСode, information, balance, limit, personalFunds);
    div.style.display = 'none';
    form.reset();
  })
}
function openAllMoney() {
  let button = document.querySelector('.all_money_card');
  let div = document.querySelector('.all_card');
  let input = div.querySelector('input');
  button.addEventListener('click', async function show() {
    allMoney = await bank.calcAllMoneyDollars();
    console.log(allMoney);
    input.value = `${allMoney}$`;
    div.style.display = 'block';
  })
}
function openDebt() {
  let button = document.querySelector('.all_debt_card');
  let div = document.querySelector('.debt_card');
  let input = div.querySelector('input');
  button.addEventListener('click', async function show() {
    allDebt = await bank.calcAllDebtDollars();
    console.log(allDebt);
    input.value = `${allDebt}$`;
    div.style.display = 'block';
  })
}
function openActive() {
  let button = document.querySelector('.debt_active_card');
  let div = document.querySelector('.active_card');
  let input = div.querySelector('input');
  button.addEventListener('click', async function show() {
    activeDebt = await bank.calcDebtDollarsActiveClients();
    console.log(activeDebt);
    input.value = `${activeDebt}$`;
    div.style.display = 'block';
  })
}
function openNactive() {
  let button = document.querySelector('.debt_nactive_card');
  let div = document.querySelector('.nactive_card');
  let input = div.querySelector('input');
  button.addEventListener('click', async function show() {
    noActiveDebt = await bank.calcDebtDollarsNotActiveClients();
    console.log(noActiveDebt);
    input.value = `${noActiveDebt}$`;
    div.style.display = 'block';
  })
}
function closeForm(idForm, buttonsClass, divsClass) {
  let form = document.getElementById(idForm);
  let button = document.querySelector(buttonsClass);
  let div = document.querySelector(divsClass);
  button.addEventListener('click', (event) => {
    event.preventDefault();
    div.style.display = 'none';
    form.reset();
  })
}


  
