const storageStatus = document.getElementById("storage-status");
const productCards = document.querySelectorAll(".product-card");
const stockDisplays = document.querySelectorAll(".product-stock");
const salesCountDisplays = document.querySelectorAll(".product-sales-count");
const increaseButtons = document.querySelectorAll(".increase-button");
const decreaseButtons = document.querySelectorAll(".decrease-button");
const productPrices = Array.from(
  productCards,
  (productCard) => Number(productCard.querySelector(".product-price span").textContent)
);
const salesStorageKey = "bunkasai-sales";
const inventoryStorageKey = "bunkasai-inventory";
const productInventoryGroups = [0, 0, 1, 1];

const counts = Array(increaseButtons.length).fill(0);
const stockCounts = Array(2).fill(0);
let amount = 0;
let unassignedSalesCount = 0;

function showStorageError(message, error) {
  storageStatus.textContent = message;
  storageStatus.hidden = false;
  console.error(message, error);
}

function isValidCount(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function normalizeInventory(value) {
  if (!Array.isArray(value) || !value.every(isValidCount)) {
    throw new Error("Saved inventory data has an invalid format.");
  }
  if (value.length === stockCounts.length) {
    return value;
  }
  if (value.length === increaseButtons.length) {
    const groupedInventory = [value[0] + value[1], value[2] + value[3]];
    if (!groupedInventory.every(isValidCount)) {
      throw new Error("Combined inventory data exceeds the supported range.");
    }
    return groupedInventory;
  }
  throw new Error("Saved inventory data has an invalid format.");
}

function updateProduct(productIndex) {
  const inventoryIndex = productInventoryGroups[productIndex];
  productInventoryGroups.forEach((groupIndex, index) => {
    if (groupIndex === inventoryIndex) {
      stockDisplays[index].textContent = stockCounts[inventoryIndex];
      increaseButtons[index].disabled = stockCounts[inventoryIndex] === 0;
    }
  });
  salesCountDisplays[productIndex].textContent = counts[productIndex];
  decreaseButtons[productIndex].disabled = counts[productIndex] === 0;
}

function saveSales() {
  localStorage.setItem(salesStorageKey, JSON.stringify({
    counts,
    unassignedCount: unassignedSalesCount,
    amount
  }));
}

function saveInventory() {
  localStorage.setItem(inventoryStorageKey, JSON.stringify(stockCounts));
}

function loadSales(value) {
  if (!value) {
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
}

function loadInventory(value) {
  const storedInventory = value === null ? null : JSON.parse(value);
  const inventory = storedInventory === null
    ? Array(stockCounts.length).fill(0)
    : normalizeInventory(storedInventory);
  inventory.forEach((count, index) => {
    stockCounts[index] = count;
  });
  if (storedInventory !== null && storedInventory.length !== stockCounts.length) {
    saveInventory();
  }
}

try {
  loadSales(localStorage.getItem(salesStorageKey));
} catch (error) {
  showStorageError("売上データを読み込めませんでした。", error);
}

try {
  loadInventory(localStorage.getItem(inventoryStorageKey));
} catch (error) {
  showStorageError("在庫データを読み込めませんでした。", error);
}

increaseButtons.forEach((button, index) => {
  updateProduct(index);
});

increaseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const productIndex = Number(button.dataset.productIndex);
    const inventoryIndex = productInventoryGroups[productIndex];
    if (stockCounts[inventoryIndex] === 0) {
      return;
    }
    counts[productIndex] += 1;
    stockCounts[inventoryIndex] -= 1;
    amount += productPrices[productIndex];
    updateProduct(productIndex);

    try {
      saveSales();
      saveInventory();
      storageStatus.hidden = true;
      storageStatus.textContent = "";
    } catch (error) {
      showStorageError("販売データを保存できませんでした。", error);
    }
  });
});

decreaseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const productIndex = Number(button.dataset.productIndex);
    const inventoryIndex = productInventoryGroups[productIndex];
    if (counts[productIndex] === 0) {
      return;
    }
    counts[productIndex] -= 1;
    stockCounts[inventoryIndex] += 1;
    amount -= productPrices[productIndex];
    updateProduct(productIndex);

    try {
      saveSales();
      saveInventory();
      storageStatus.hidden = true;
      storageStatus.textContent = "";
    } catch (error) {
      showStorageError("販売データを保存できませんでした。", error);
    }
  });
});

window.addEventListener("storage", (event) => {
  try {
    if (event.key === inventoryStorageKey) {
      loadInventory(event.newValue);
      increaseButtons.forEach((button, index) => {
        updateProduct(index);
      });
    } else if (event.key === salesStorageKey) {
      counts.fill(0);
      unassignedSalesCount = 0;
      amount = 0;
      loadSales(event.newValue);
      increaseButtons.forEach((button, index) => {
        updateProduct(index);
      });
    }
  } catch (error) {
    showStorageError("保存データの更新を読み込めませんでした。", error);
  }
});
