import Swal from "sweetalert2";

const API_BASE_URL = "http://localhost:5000/api/categories";

/**
 * Fetch all categories from backend MongoDB
 */
export async function getCategories(type = "") {
  try {
    const url = type ? `${API_BASE_URL}?type=${type}` : API_BASE_URL;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      return data.categories;
    }
    return [];
  } catch (err) {
    console.error("Failed to load categories from server:", err);
    return [];
  }
}

/**
 * Create a new category in MongoDB
 */
export async function addCategory({ name, type, is_default = false }) {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, type, is_default }),
  });
  return await res.json();
}

/**
 * Delete any category (default or custom) from MongoDB
 */
export async function deleteCategoryById(id) {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  return await res.json();
}

/**
 * Update category (e.g. toggle is_default)
 */
export async function updateCategoryById(id, updateData) {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });
  return await res.json();
}

/**
 * Open SweetAlert2 category manager modal
 * Allows adding new categories, making them default, and deleting any existing category
 */
export async function openCategoryManagerModal(onSuccessCallback) {
  // 1. Fetch current categories from backend
  let categories = [];
  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }

  // Generate category items HTML for the list view
  const renderCategoryListHtml = (items) => {
    if (!items || items.length === 0) {
      return `<p style="color: #64748b; font-size: 13px; margin: 15px 0;">No categories found in database.</p>`;
    }

    return `
      <div style="max-height: 230px; overflow-y: auto; text-align: left; margin-top: 15px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 10px; background: #fafafa;">
        ${items
          .map((cat) => {
            const catId = cat._id || cat.id || cat.category_id;
            const isDefault = Boolean(cat.is_default);
            const isExpense = cat.type === "expense";
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 7px 6px; border-bottom: 1px solid #f1f5f9;">
                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                  <span style="font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: ${isExpense ? "#fee2e2" : "#dcfce7"}; color: ${isExpense ? "#b91c1c" : "#15803d"}; text-transform: uppercase;">
                    ${cat.type}
                  </span>
                  <span style="font-size: 13px; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${cat.name}
                  </span>
                  ${
                    isDefault
                      ? `<span style="font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; background: #e0f2fe; color: #0369a1;">Default</span>`
                      : ""
                  }
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-left: 8px;">
                  <button 
                    type="button" 
                    id="btn-toggle-${catId}" 
                    title="${isDefault ? 'Remove Default status' : 'Make this category Default'}"
                    style="font-size: 11px; padding: 3px 8px; border-radius: 5px; border: 1px solid #cbd5e1; background: ${isDefault ? '#f1f5f9' : '#eff6ff'}; color: ${isDefault ? '#64748b' : '#2563eb'}; cursor: pointer;"
                  >
                    ${isDefault ? 'Unset Default' : 'Make Default'}
                  </button>
                  <button 
                    type="button" 
                    id="btn-del-${catId}" 
                    title="Delete category from DB"
                    style="font-size: 11px; padding: 3px 8px; border-radius: 5px; border: 1px solid #fca5a5; background: #fff1f2; color: #e11d48; cursor: pointer; font-weight: 700;"
                  >
                    ✕ Delete
                  </button>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  };

  const modalHtml = `
    <div style="font-family: inherit; text-align: left;">
      <!-- Tabs header -->
      <div style="display: flex; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 14px;">
        <button id="tab-add" type="button" style="background: none; border: none; font-size: 14px; font-weight: 700; color: #07845e; cursor: pointer; border-bottom: 2px solid #07845e; padding: 4px 8px; margin-bottom: -10px;">
          ＋ Add New Category
        </button>
        <button id="tab-list" type="button" style="background: none; border: none; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; padding: 4px 8px; margin-bottom: -10px;">
          📋 Manage Existing (${categories.length})
        </button>
      </div>

      <!-- Tab 1: Add New Category Form -->
      <div id="view-add" style="display: block;">
        <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px;">
          Category Name <span style="color: #ef4444;">*</span>
        </label>
        <input 
          id="swal-cat-name" 
          type="text" 
          placeholder="e.g. Hostel Laundry, Gaming, Book Allowance" 
          style="width: 100%; box-sizing: border-box; padding: 9px 12px; font-size: 14px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 12px; outline: none;"
        />

        <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px;">
          Category Type <span style="color: #ef4444;">*</span>
        </label>
        <select 
          id="swal-cat-type" 
          style="width: 100%; box-sizing: border-box; padding: 9px 12px; font-size: 14px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14px; background: #ffffff;"
        >
          <option value="expense">Expense (Money Out)</option>
          <option value="income">Income (Money In)</option>
        </select>

        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #1e293b; cursor: pointer; padding: 6px 0; user-select: none;">
          <input id="swal-cat-default" type="checkbox" style="width: 16px; height: 16px; accent-color: #07845e; cursor: pointer;" />
          Make this a default category
        </label>
        <span style="display: block; font-size: 11px; color: #64748b; margin-top: 2px;">
          Checked categories will be designated as default across transactions.
        </span>
      </div>

      <!-- Tab 2: Manage Existing Categories List -->
      <div id="view-list" style="display: none;">
        <p style="font-size: 12px; color: #64748b; margin: 0 0 5px;">
          You can delete any default or custom category from the database, or toggle its default status.
        </p>
        <div id="category-list-container">
          ${renderCategoryListHtml(categories)}
        </div>
      </div>
    </div>
  `;

  const result = await Swal.fire({
    title: "<strong>Category Manager</strong>",
    html: modalHtml,
    showCancelButton: true,
    confirmButtonText: "Add Category",
    confirmButtonColor: "#07845e",
    cancelButtonText: "Close",
    cancelButtonColor: "#64748b",
    focusConfirm: false,
    didOpen: () => {
      const popup = Swal.getPopup();
      const tabAdd = popup.querySelector("#tab-add");
      const tabList = popup.querySelector("#tab-list");
      const viewAdd = popup.querySelector("#view-add");
      const viewList = popup.querySelector("#view-list");
      const confirmBtn = Swal.getConfirmButton();

      // Switch to Add Tab
      tabAdd.addEventListener("click", () => {
        viewAdd.style.display = "block";
        viewList.style.display = "none";
        tabAdd.style.color = "#07845e";
        tabAdd.style.borderBottom = "2px solid #07845e";
        tabList.style.color = "#64748b";
        tabList.style.borderBottom = "none";
        confirmBtn.style.display = "inline-block";
        confirmBtn.textContent = "Add Category";
      });

      // Switch to List Tab
      tabList.addEventListener("click", () => {
        viewAdd.style.display = "none";
        viewList.style.display = "block";
        tabList.style.color = "#07845e";
        tabList.style.borderBottom = "2px solid #07845e";
        tabAdd.style.color = "#64748b";
        tabAdd.style.borderBottom = "none";
        confirmBtn.style.display = "none"; // In list view, close button is primary
      });

      // Attach event listeners for delete and toggle buttons inside the list
      const bindListActionButtons = () => {
        categories.forEach((cat) => {
          const catId = cat._id || cat.id || cat.category_id;

          // Delete button
          const delBtn = popup.querySelector(`#btn-del-${catId}`);
          if (delBtn) {
            delBtn.onclick = async () => {
              const confirm = await Swal.fire({
                title: `Delete "${cat.name}"?`,
                text: "This will permanently remove this category from the database.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#e11d48",
                cancelButtonColor: "#64748b",
                confirmButtonText: "Yes, delete it",
              });

              if (confirm.isConfirmed) {
                try {
                  const res = await deleteCategoryById(catId);
                  if (res.success) {
                    categories = categories.filter((c) => (c._id || c.id || c.category_id) !== catId);
                    popup.querySelector("#category-list-container").innerHTML = renderCategoryListHtml(categories);
                    tabList.textContent = `📋 Manage Existing (${categories.length})`;
                    bindListActionButtons();
                    if (typeof onSuccessCallback === "function") onSuccessCallback();
                    Swal.showValidationMessage("");
                  } else {
                    Swal.showValidationMessage(res.message || "Failed to delete");
                  }
                } catch (e) {
                  Swal.showValidationMessage("Error: " + e.message);
                }
              }
            };
          }

          // Toggle is_default button
          const toggleBtn = popup.querySelector(`#btn-toggle-${catId}`);
          if (toggleBtn) {
            toggleBtn.onclick = async () => {
              const newDefault = !cat.is_default;
              try {
                const res = await updateCategoryById(catId, { is_default: newDefault });
                if (res.success) {
                  cat.is_default = newDefault;
                  popup.querySelector("#category-list-container").innerHTML = renderCategoryListHtml(categories);
                  bindListActionButtons();
                  if (typeof onSuccessCallback === "function") onSuccessCallback();
                } else {
                  Swal.showValidationMessage(res.message || "Failed to update");
                }
              } catch (e) {
                Swal.showValidationMessage("Error: " + e.message);
              }
            };
          }
        });
      };

      bindListActionButtons();
    },
    preConfirm: async () => {
      const name = document.getElementById("swal-cat-name")?.value?.trim();
      const type = document.getElementById("swal-cat-type")?.value;
      const is_default = Boolean(document.getElementById("swal-cat-default")?.checked);

      if (!name) {
        Swal.showValidationMessage("Please enter a category name");
        return false;
      }

      try {
        const response = await addCategory({ name, type, is_default });
        if (!response.success) {
          Swal.showValidationMessage(response.message || "Failed to add category");
          return false;
        }
        return response.category;
      } catch (err) {
        Swal.showValidationMessage("Server connection error: " + err.message);
        return false;
      }
    },
  });

  if (result.isConfirmed && result.value) {
    Swal.fire({
      icon: "success",
      title: "Category Created!",
      text: `"${result.value.name}" was added to ${result.value.type} categories (${result.value.is_default ? "Default" : "Custom"}).`,
      timer: 2200,
      showConfirmButton: false,
    });

    if (typeof onSuccessCallback === "function") {
      onSuccessCallback(result.value);
    }
  }
}
