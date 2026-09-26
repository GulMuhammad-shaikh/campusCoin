import Swal from "sweetalert2";
import { categoryAPI } from "./api";

/**
 * Fetch all categories from backend (uses Axios via api.js)
 */
export async function getCategories(type = "") {
  try {
    const data = await categoryAPI.getAll(type);
    return data.categories || [];
  } catch (err) {
    console.error("Failed to load categories:", err.message);
    return [];
  }
}

/**
 * Create a new category (uses Axios via api.js)
 */
export async function addCategory({ name, type, is_default = false }) {
  try {
    return await categoryAPI.create({ name, type, is_default });
  } catch (err) {
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

/**
 * Delete a category by ID
 */
export async function deleteCategoryById(id) {
  try {
    return await categoryAPI.delete(id);
  } catch (err) {
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

/**
 * Update a category (e.g. toggle is_default)
 */
export async function updateCategoryById(id, updateData) {
  try {
    return await categoryAPI.update(id, updateData);
  } catch (err) {
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

/**
 * Open SweetAlert2 category manager modal
 * Allows adding new categories, making them default, and deleting any existing category
 */
export async function openCategoryManagerModal(onSuccessCallback) {
  let categories = [];
  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }

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
                  ${isDefault ? `<span style="font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; background: #e0f2fe; color: #0369a1;">Default</span>` : ""}
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-left: 8px;">
                  <button 
                    type="button" id="btn-toggle-${catId}"
                    style="font-size: 11px; padding: 3px 8px; border-radius: 5px; border: 1px solid #cbd5e1; background: ${isDefault ? "#f1f5f9" : "#eff6ff"}; color: ${isDefault ? "#64748b" : "#2563eb"}; cursor: pointer;"
                  >${isDefault ? "Unset Default" : "Make Default"}</button>
                  <button 
                    type="button" id="btn-del-${catId}"
                    style="font-size: 11px; padding: 3px 8px; border-radius: 5px; border: 1px solid #fca5a5; background: #fff1f2; color: #e11d48; cursor: pointer; font-weight: 700;"
                  >✕ Delete</button>
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
      <div style="display: flex; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 14px;">
        <button id="tab-add" type="button" style="background: none; border: none; font-size: 14px; font-weight: 700; color: #07845e; cursor: pointer; border-bottom: 2px solid #07845e; padding: 4px 8px; margin-bottom: -10px;">＋ Add New Category</button>
        <button id="tab-list" type="button" style="background: none; border: none; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; padding: 4px 8px; margin-bottom: -10px;">📋 Manage Existing (${categories.length})</button>
      </div>

      <div id="view-add" style="display: block;">
        <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px;">Category Name <span style="color: #ef4444;">*</span></label>
        <input id="swal-cat-name" type="text" placeholder="e.g. Hostel Laundry, Gaming, Book Allowance"
          style="width: 100%; box-sizing: border-box; padding: 9px 12px; font-size: 14px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 12px; outline: none;" />
        <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px;">Category Type <span style="color: #ef4444;">*</span></label>
        <select id="swal-cat-type"
          style="width: 100%; box-sizing: border-box; padding: 9px 12px; font-size: 14px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14px; background: #ffffff;">
          <option value="expense">Expense (Money Out)</option>
          <option value="income">Income (Money In)</option>
        </select>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #1e293b; cursor: pointer; padding: 6px 0; user-select: none;">
          <input id="swal-cat-default" type="checkbox" style="width: 16px; height: 16px; accent-color: #07845e; cursor: pointer;" />
          Make this a default category
        </label>
        <span style="display: block; font-size: 11px; color: #64748b; margin-top: 2px;">Default categories appear in transaction dropdowns automatically.</span>
      </div>

      <div id="view-list" style="display: none;">
        <p style="font-size: 12px; color: #64748b; margin: 0 0 5px;">Delete or toggle default status for any category.</p>
        <div id="category-list-container">${renderCategoryListHtml(categories)}</div>
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

      tabAdd.addEventListener("click", () => {
        viewAdd.style.display = "block";
        viewList.style.display = "none";
        tabAdd.style.color = "#07845e";
        tabAdd.style.borderBottom = "2px solid #07845e";
        tabList.style.color = "#64748b";
        tabList.style.borderBottom = "none";
        confirmBtn.style.display = "inline-block";
      });

      tabList.addEventListener("click", () => {
        viewAdd.style.display = "none";
        viewList.style.display = "block";
        tabList.style.color = "#07845e";
        tabList.style.borderBottom = "2px solid #07845e";
        tabAdd.style.color = "#64748b";
        tabAdd.style.borderBottom = "none";
        confirmBtn.style.display = "none";
      });

      const bindListActions = () => {
        categories.forEach((cat) => {
          const catId = cat._id || cat.id || cat.category_id;

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
                    categories = categories.filter(
                      (c) => (c._id || c.id || c.category_id) !== catId
                    );
                    popup.querySelector("#category-list-container").innerHTML =
                      renderCategoryListHtml(categories);
                    tabList.textContent = `📋 Manage Existing (${categories.length})`;
                    bindListActions();
                    if (typeof onSuccessCallback === "function") onSuccessCallback();
                  } else {
                    Swal.showValidationMessage(res.message || "Failed to delete");
                  }
                } catch (e) {
                  Swal.showValidationMessage("Error: " + e.message);
                }
              }
            };
          }

          const toggleBtn = popup.querySelector(`#btn-toggle-${catId}`);
          if (toggleBtn) {
            toggleBtn.onclick = async () => {
              const newDefault = !cat.is_default;
              try {
                const res = await updateCategoryById(catId, { is_default: newDefault });
                if (res.success) {
                  cat.is_default = newDefault;
                  popup.querySelector("#category-list-container").innerHTML =
                    renderCategoryListHtml(categories);
                  bindListActions();
                  if (typeof onSuccessCallback === "function") onSuccessCallback();
                }
              } catch (e) {
                Swal.showValidationMessage("Error: " + e.message);
              }
            };
          }
        });
      };

      bindListActions();
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
        Swal.showValidationMessage("Server error: " + err.message);
        return false;
      }
    },
  });

  if (result.isConfirmed && result.value) {
    Swal.fire({
      icon: "success",
      title: "Category Created!",
      text: `"${result.value.name}" was added to ${result.value.type} categories.`,
      timer: 2000,
      showConfirmButton: false,
    });
    if (typeof onSuccessCallback === "function") onSuccessCallback(result.value);
  }
}
