// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Product deletion confirmation
    const deleteButtons = document.querySelectorAll('.delete-product');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to delete this product?')) {
                const productId = button.dataset.productId;
                try {
                    const response = await fetch(`/admin/products/${productId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        // Remove the product element from the DOM
                        button.closest('.product-item').remove();
                        showAlert('Product deleted successfully', 'success');
                    } else {
                        showAlert('Error deleting product', 'danger');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showAlert('Error deleting product', 'danger');
                }
            }
        });
    });

    // Category deletion confirmation
    const deleteCategoryButtons = document.querySelectorAll('.delete-category');
    deleteCategoryButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to delete this category?')) {
                const categoryId = button.dataset.categoryId;
                try {
                    const response = await fetch(`/admin/categories/${categoryId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        button.closest('.category-item').remove();
                        showAlert('Category deleted successfully', 'success');
                    } else {
                        const data = await response.json();
                        showAlert(data.message || 'Error deleting category', 'danger');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showAlert('Error deleting category', 'danger');
                }
            }
        });
    });

    // Form validation
    const forms = document.querySelectorAll('.needs-validation');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    // Stock update handling
    const stockInputs = document.querySelectorAll('.stock-input');
    stockInputs.forEach(input => {
        input.addEventListener('change', async (e) => {
            const productId = input.dataset.productId;
            const newStock = input.value;

            try {
                const response = await fetch(`/admin/products/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ stock: newStock })
                });

                if (response.ok) {
                    showAlert('Stock updated successfully', 'success');
                } else {
                    showAlert('Error updating stock', 'danger');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error updating stock', 'danger');
            }
        });
    });

    // Alert helper function
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    // Image preview for product form
    const imageInput = document.querySelector('#productImage');
    const imagePreview = document.querySelector('#imagePreview');

    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Search functionality
    const searchInput = document.querySelector('#searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.searchable-item');
            
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        }, 300));
    }

    // Debounce helper function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}); 