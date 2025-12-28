/* ================= CONFIG ================= */
const APP_ID = "INNOVASH_KR_001";
const RENEWAL_URL = "https://asha2110.github.io/Innovaash-renewal/renewal.json";
const GRACE_DAYS = 7;

/* ================= STATE ================= */
let serverExpiry = null;
let prices = JSON.parse(localStorage.getItem("prices")) ||
[1,2,5,6,10,12,15,18,20,25,30,40,50,100,125,180,300];

let adminPin = localStorage.getItem("pin") || "1234";

let cash = Number(localStorage.getItem("todayCash")) || 0;
let upi  = Number(localStorage.getItem("todayUpi"))  || 0;
let total = 0;

let todayTotal = Number(localStorage.getItem("todayTotal")) || 0;

/* ================= DATE HELPERS ================= */
function todayKey() {
  return new Date().toISOString().slice(0,10);
}

/* ================= LICENSE ================= */
async function fetchExpiry(){
  try {
    const res = await fetch(RENEWAL_URL,{ cache:"no-store"});
    const data = await res.json();
    serverExpiry = data[APP_ID] || null;
    if(serverExpiry) localStorage.setItem("lastExpiry", serverExpiry);
  } catch {
    serverExpiry = localStorage.getItem("lastExpiry");
  }
}

function getServiceStatus(){
  if(!serverExpiry) return "active";
  const diffDays = Math.floor(
    (new Date(serverExpiry) - new Date()) / 86400000
  );
  if(diffDays >= 0) return "active";
  if(diffDays >= -GRACE_DAYS) return "grace";
  return "expired";
}

function canBill(){
  const status = getServiceStatus();
  if(status === "expired"){
    alert("Service expired. Please contact support.");
    return false;
  }
  if(status === "grace"){
    alert("Service overdue. Please renew.");
  }
  return true;
}

/* ================= UI ================= */
function renderButtons() {
  const div = document.getElementById("buttons");
  div.innerHTML = "";
  prices.forEach(p => {
    const b = document.createElement("button");
    b.className = "price-btn";
    b.innerText = "₹" + p;
    b.onclick = () => add(p);
    div.appendChild(b);
  });
}

function update() {
  document.getElementById("total").innerText = "₹" + total;
  document.getElementById("todaySales").innerText ="₹"+ todayTotal;
}

/* ================= BILLING ================= */
function add(p) {
  if(!canBill()) return;
  total += p;
  update();
}

function pay(type) {
  if(!canBill() || total <= 0) return;

  if(type === "cash") cash += total;
  else upi += total;

  todayTotal += total; 

  localStorage.setItem("todayCash", cash);
  localStorage.setItem("todayUpi", upi);
  localStorage.setItem("todayTotal", todayTotal);

  total = 0;
  update();
}

/* ================= END DAY ================= */
function endDay() {
  if(todayTotal === 0){
    alert("No sales today");
    return;
  }

  const history = JSON.parse(localStorage.getItem("history")) || [];
  history.push({
    date: todayKey(),
    cash, upi, total: todayTotal
  });

  localStorage.setItem("history", JSON.stringify(history));

  const text =
`🧾 DAILY SALES (${todayKey()})
Cash: ₹${cash}
UPI: ₹${upi}
Total: ₹${todayTotal}
-Innovaash Billing`;

  if(confirm(text + "\n\nShare on WhatsApp?")){
    window.open(
      "https://wa.me/?text=" + encodeURIComponent(text),
      "_blank"
    );
  }

  cash = 0;
  upi = 0;
  total = 0;
  todayTotal = 0;
  localStorage.removeItem("todayCash");
  localStorage.removeItem("todayUpi");
  localStorage.removeItem("todayTotal");
  update();
}

/* ================= ADMIN ================= */
function adminAccess() {
  if(prompt("Admin PIN") !== adminPin){
    alert("Wrong PIN"); return;
  }

  const action = Number(prompt(
`Innovaash POS
1.Edit Prices
2.Change PIN
3.Reset Day
4.View History
5.Backup`
  ));

  if(action === 1){
    const p = prompt("Comma separated prices", prices.join(","));
    if(!p) return;
    prices = p.split(",").map(Number);
    localStorage.setItem("prices", JSON.stringify(prices));
    renderButtons();
  }

  if(action === 2){
    adminPin = prompt("New PIN");
    if(adminPin) localStorage.setItem("pin", adminPin);
  }

  if(action === 3){
    cash=upi=total=0;
    localStorage.removeItem("todayCash");
    localStorage.removeItem("todayUpi");
    update();
  }

  if(action === 4){
    let msg="📅 SALES HISTORY\n\n";
    (JSON.parse(localStorage.getItem("history"))||[])
      .slice(-7)
      .forEach(d=>msg+=`${d.date} ₹${d.total}\n`);
    alert(msg);
  }

  if(action === 5){
    let msg="🗂 POS BACKUP\n\n";
    (JSON.parse(localStorage.getItem("history"))||[])
      .forEach(d=>{
        msg+=`${d.date} | Cash ₹${d.cash} | UPI ₹${d.upi} | Total ₹${d.total}\n`;
      });
    window.open("https://wa.me/?text="+encodeURIComponent(msg));
  }
}

/* ================= INIT ================= */
renderButtons();
fetchExpiry();
update();