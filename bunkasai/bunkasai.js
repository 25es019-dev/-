const salesAmount = document.getElementById("sales-amount");
const storageStatus = document.getElementById("storage-status");
const resetButton = document.getElementById("reset-button");
const productCounts = document.querySelectorAll(".product-count");
const productTotals = document.querySelectorAll(".product-total");
const productCards = document.querySelectorAll(".product-card");
const productPrices = Array.from(
  productCards,
  (productCard) => Number(productCard.querySelector(".product-price span").textContent)
);
const unassignedCount = document.getElementById("unassigned-count");
const unassignedCountValue = document.getElementById("unassigned-count-value");
const storageKey = "bunkasai-sales";

const counts = Array(productCounts.length).fill(0);
let unassignedSalesCount = 0;
let amount = 0;

function showStorageError(message, error) {
  storageStatus.textContent = message;
  storageStatus.hidden = false;
  console.error(message, error);
}

function isValidCount(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function renderSales() {
  salesAmount.textContent = amount;
  productCounts.forEach((productCount, index) => {
    productCount.textContent = counts[index];
    productTotals[index].textContent = counts[index] * productPrices[index];
  });
  unassignedCountValue.textContent = unassignedSalesCount;
  unassignedCount.hidden = unassignedSalesCount === 0;
}

function loadSales(value) {
  counts.fill(0);
  unassignedSalesCount = 0;
  amount = 0;
  if (value === null) {
    renderSales();
    return;
  }
  const parsedData = JSON.parse(value);
  if (!parsedData || typeof parsedData !== "object" || !isValidCount(parsedData.amount)) {
    throw new Error("Saved sales data has an invalid format.");
  }
  if (Array.isArray(parsedData.counts)) {
    if (
      parsedData.counts.length !== counts.length ||
      !parsedData.counts.every(isValidCount) ||
      !isValidCount(parsedData.unassignedCount)
    ) {
      throw new Error("Saved product sales data has an invalid format.");
    }
    parsedData.counts.forEach((count, index) => {
      counts[index] = count;
    });
    unassignedSalesCount = parsedData.unassignedCount;
  } else if (isValidCount(parsedData.count)) {
    unassignedSalesCount = parsedData.count;
  } else {
    throw new Error("Saved sales data has an invalid format.");
  }
  amount = parsedData.amount;
  renderSales();
}

try {
  loadSales(localStorage.getItem(storageKey));
} catch (error) {
  showStorageError("売上データを読み込めませんでした。", error);
}

window.addEventListener("storage", (event) => {
  if (event.key !== storageKey) {
    return;
  }
  try {
    loadSales(event.newValue);
  } catch (error) {
    showStorageError("売上データの更新を読み込めませんでした。", error);
  }
});

resetButton.addEventListener("click", () => {
  if (!window.confirm("販売数と売上金額を0にリセットします。在庫数は変更しません。よろしいですか？")) {
    return;
  }
  counts.fill(0);
  unassignedSalesCount = 0;
  amount = 0;
  renderSales();

  try {
    localStorage.setItem(storageKey, JSON.stringify({
      counts,
      unassignedCount: unassignedSalesCount,
      amount
    }));
    storageStatus.hidden = true;
    storageStatus.textContent = "";
  } catch (error) {
    showStorageError("リセット内容を保存できませんでした。ページを更新するとリセット前の値に戻る可能性があります。", error);
  }
});
