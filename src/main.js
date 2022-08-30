import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import gofundmeAbi from "../contract/gofundme.abi.json"

import erc20Abi from "../contract/erc20.abi.json"
const ERC20_DECIMALS = 18
const contractAddress = "0x8Cbfdccc5e011B9Fcd14896557d6E6bC571B8F59"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
const bgColor = "#edc0e0"
let kit
let contract
let fundMes = []
const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(gofundmeAbi, contractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}
async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(contractAddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}
const getfundeMes = async function () {
  const _listLength = await contract.methods.getListLength().call()
  const _fundMes = []
  for (let i = 0; i < _listLength; i++) {
    let _fundMe = new Promise(async (resolve, reject) => {
      let p = await contract.methods.readFundMe(i).call()
      let x = await contract.methods.getFundersLength(i).call()
      resolve({
        index: i,
        owner: p[0],
        name: p[1],
        image: p[2],
        description: p[3],
        location: p[4],
        balance: new BigNumber(p[5]),
        funded: p[6],
        funders: x,
      })
    })
    _fundMes.push(_fundMe)
  }
  fundMes = await Promise.all(_fundMes)
  renderFundMes()
}

function renderFundMes() {
  document.getElementById("fundMe").innerHTML = ""
  fundMes.forEach((fundMe) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"

    newDiv.innerHTML = fundMeTemplate(fundMe)
    document.getElementById("fundMe").appendChild(newDiv)
  })
}
function fundMeTemplate(fundMe) {
  return `
      <div class="card mb-4">
        <img class="card-img-top" src="${fundMe.image}" alt="...">
        <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
          ${fundMe.funders} Funders
        </div>
       
        <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(fundMe.owner)}
        </div>
        <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
           ${fundMe.balance == 0 ? `Funded` : `Funding`}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${fundMe.name}</h2>
        <p class="card-text mb-2" style="min-height: 82px">
        ${fundMe.description}             
        </p>
        <h2 class="card-title fs-4 fw-bold mt-2">BALANCE LEFT: ${fundMe.balance
          .shiftedBy(-ERC20_DECIMALS)
          .toFixed(2)}  cUSD</h2>
        
        <p class="card-text mt-2">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${fundMe.location}</span>
        </p>
        ${
          fundMe.balance > 0
            ? `
        <div class="d-grid gap-2" 
        >
          <a class="btn btn-lg btn-outline-dark contributeBtn  fs-6 p-3" id=${fundMe.index}
          data-fundMe-id = ${fundMe.index}
          data-bs-toggle="modal"
          data-bs-target="#paymentModal">
            CONTRIBUTE
          </a>
        </div>`
            : ""
        }
      </div>
    </div>
    
  `
}
function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
    <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
      <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
          target="_blank">
          <img src="${icon}" width="48" alt="${_address}">
      </a>
    </div>
    `
}
function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}
window.addEventListener("load", async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await getfundeMes()
  notificationOff()
})
document.querySelector("#createFundMe").addEventListener("click", async (e) => {
  const params = [
    document.getElementById("newFundMe").value,
    document.getElementById("newImgUrl").value,
    document.getElementById("newFundMeDescription").value,
    document.getElementById("newLocation").value,
    new BigNumber(document.getElementById("newAmount").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString(),
  ]
  console.log(...params)
  notification(`⌛ Adding "${params[0]}"...`)
  try {
    const result = await contract.methods
      .createFundMe(...params)
      .send({ from: kit.defaultAccount })
    console.log(result)
  } catch (error) {
    notification(`⚠️ ${error}.`)
  }
  notification(`🎉 You successfully added "${params[0]}".`)
  getfundeMes()
})
document.querySelector("#fundMe").addEventListener("click", async (e) => {
  if (e.target.className.includes("contributeBtn")) {
    const index = e.target.id
    document
      .getElementById("contribution")
      .addEventListener("change", async (e) => {
        e.preventDefault()
        const amount = new BigNumber(e.target.value)
          .shiftedBy(ERC20_DECIMALS)
          .toString()
        document
          .getElementById("contribute")
          .addEventListener("click", async () => {
            notification("⌛ Waiting for contribution approval...")
            try {
              await approve(amount)
            } catch (error) {
              notification(`⚠️ ${error}.`)
            }
            notification(
              `⌛ Awaiting contribution for "${fundMes[index].name}"...`
            )
            try {
              const result = await contract.methods
                .fund(index, amount)
                .send({ from: kit.defaultAccount })
              notification(
                `🎉 You successfully funded "${fundMes[index].name}".`
              )
              getfundeMes()
              getBalance()
            } catch (error) {
              notification(`⚠️ ${error}.`)
            }
          })
      })
  }
})

// const products = [
//     {
//       name: "Giant BBQ",
//       image: "https://imgur.com/t/science_and_tech/5bjLUrZ", rocket Image
//       description: `Grilled chicken, beef, fish, sausages, bacon,
//         vegetables served with chips.`,
//       location: "Kimironko Market",
//       owner: "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
//       price: 3,
//       sold: 27,
//       index: 0,
//     },
//     {
//       name: "BBQ Chicken",
//       image: "https://imgur.com/gallery/MgAnW3I",
//       description: `French fries and grilled chicken served with gacumbari
//         and avocados with cheese.`,
//       location: "Afrika Fresh KG 541 St",
//       owner: "0x3275B7F400cCdeBeDaf0D8A9a7C8C1aBE2d747Ea",
//       price: 4,
//       sold: 12,
//       index: 1,
//     },
//     {
//       name: "Beef burrito",
//       image: "https://imgur.com/gallery/y4SSUnC",
//       description: `Homemade tortilla with your choice of filling, cheese,
//         guacamole salsa with Mexican refried beans and rice.`,
//       location: "Asili - KN 4 St",
//       owner: "0x2EF48F32eB0AEB90778A2170a0558A941b72BFFb",
//       price: 2,
//       sold: 35,
//       index: 2,
//     },
//     {
//       name: "Barbecue Pizza",
//       image: "https://i.imgur.com/fpiDeFd.png",
//       description: `Barbecue Chicken Pizza: Chicken, gouda, pineapple, onions
//         and house-made BBQ sauce.`,
//       location: "Kigali Hut KG 7 Ave",
//       owner: "0x2EF48F32eB0AEB90778A2170a0558A941b72BFFb",
//       price: 1,
//       sold: 2,
//       index: 3,
//     },
//   ]
// owner: "0x7Aa0245A692B67C7990c6bB4167F83f798654b26",
// ipfs://bafybeiafqyvwtfkwusf3swscxh7ou5iqpjmi66aefpi3pq73upbakn56kq/1.jpg
// https://ipfs.io/ipfs/bafybeiafqyvwtfkwusf3swscxh7ou5iqpjmi66aefpi3pq73upbakn56kq/2.png
