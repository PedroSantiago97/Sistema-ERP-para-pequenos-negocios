// Variáveis globais
let products = [];
let selectedProduct = null;

// Verificar autenticação e carregar dados
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadProducts();
});

function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    // Verificar se é gerenciador
    const userLogin = (userData.login || userData.username || userData.email || '').toLowerCase().trim();
    const isGerenciador = userLogin === 'gerenciador';
    
    if (!isGerenciador) {
        window.location.href = 'pdv.html';
        return;
    }
    
    document.getElementById('userName').textContent = userData.name || userData.login || 'Gerenciador';
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Navegação entre seções
function showSection(section) {
    // Esconder todas as seções
    document.getElementById('productsSection').style.display = 'none';
    document.getElementById('reportsSection').style.display = 'none';
    document.getElementById('usersSection').style.display = 'none';
    document.getElementById('settingsSection').style.display = 'none';
    
    // Remover classe active de todos os itens
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mostrar seção selecionada e adicionar classe active
    document.getElementById(section + 'Section').style.display = 'block';
    event.target.classList.add('active');
}

// Carregar produtos
async function loadProducts() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:8443/api/produtos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            products = await response.json();
            renderProductsList();
        } else {
            console.error('Erro ao carregar produtos');
            // Dados mock para teste
            products = getMockProducts();
            renderProductsList();
        }
    } catch (error) {
        console.error('Erro:', error);
        // Dados mock para teste
        products = getMockProducts();
        renderProductsList();
    }
}

// Renderizar lista de produtos
function renderProductsList(filteredProducts = null) {
    const productsList = document.getElementById('productsList');
    const productsToRender = filteredProducts || products;
    
    productsList.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #7f8c8d;">Nenhum produto encontrado</div>';
        return;
    }
    
    productsToRender.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = `product-item ${selectedProduct && selectedProduct.id === product.id ? 'selected' : ''}`;
        productItem.onclick = () => selectProduct(product);
        
        productItem.innerHTML = `
            <div class="product-code">${product.ean}</div>
            <div class="product-name">${product.nome}</div>
            <div class="product-price">R$ ${product.precoVenda.toFixed(2)}</div>
            <div style="font-size: 0.8rem; color: #7f8c8d;">Estoque: ${product.estoqueAtual}</div>
        `;
        
        productsList.appendChild(productItem);
    });
}

// Selecionar produto
function selectProduct(product) {
    selectedProduct = product;
    renderProductsList(); // Re-render para atualizar seleção
    showProductDetails(product);
}

// Mostrar detalhes do produto
function showProductDetails(product) {
    const detailsContainer = document.getElementById('productDetails');
    
    const isLowStock = product.estoqueAtual <= product.estoqueMinimo;
    const stockClass = isLowStock ? 'stock-low' : 'stock-ok';
    const stockText = isLowStock ? 'ESTOQUE BAIXO' : 'ESTOQUE OK';
    
    detailsContainer.innerHTML = `
        <div class="detail-section">
            <h3>Informações Básicas</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Código de Barras (EAN)</div>
                    <div class="detail-value">${product.ean}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Nome</div>
                    <div class="detail-value">${product.nome}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Categoria</div>
                    <div class="detail-value">${product.categoria}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Fornecedor</div>
                    <div class="detail-value">${product.fornecedor}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Preços e Estoque</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Preço de Custo</div>
                    <div class="detail-value">R$ ${product.precoCusto.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Preço de Venda</div>
                    <div class="detail-value" style="color: #27ae60; font-weight: 600;">R$ ${product.precoVenda.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Margem de Lucro</div>
                    <div class="detail-value" style="color: #2980b9; font-weight: 600;">
                        ${calculateProfitMargin(product.precoCusto, product.precoVenda)}%
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Estoque Atual</div>
                    <div class="detail-value ${stockClass}">${product.estoqueAtual} unidades</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Estoque Mínimo</div>
                    <div class="detail-value">${product.estoqueMinimo} unidades</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status do Estoque</div>
                    <div class="detail-value ${stockClass}">${stockText}</div>
                </div>
            </div>
        </div>
        
        <div class="action-buttons">
            <button class="btn btn-primary" onclick="openProductModal('edit')">Editar Produto</button>
            <button class="btn btn-danger" onclick="deleteProduct(${product.id})">Excluir Produto</button>
        </div>
    `;
}

// Calcular margem de lucro
function calculateProfitMargin(cost, price) {
    const margin = ((price - cost) / cost) * 100;
    return margin.toFixed(1);
}

// Buscar produtos
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        renderProductsList();
        return;
    }
    
    const filteredProducts = products.filter(product => 
        product.ean.toLowerCase().includes(searchTerm) ||
        product.nome.toLowerCase().includes(searchTerm) ||
        product.categoria.toLowerCase().includes(searchTerm)
    );
    
    renderProductsList(filteredProducts);
    
    if (filteredProducts.length > 0) {
        selectProduct(filteredProducts[0]);
    } else {
        document.getElementById('productDetails').innerHTML = `
            <div style="text-align: center; color: #7f8c8d; padding: 2rem;">
                Nenhum produto encontrado para "${searchTerm}"
            </div>
        `;
    }
}

// Modal de produto
function openProductModal(mode = 'create') {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('productForm');
    
    if (mode === 'edit' && selectedProduct) {
        title.textContent = 'Editar Produto';
        fillProductForm(selectedProduct);
    } else {
        title.textContent = 'Novo Produto';
        form.reset();
        selectedProduct = null;
    }
    
    modal.style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('productForm').reset();
}

function fillProductForm(product) {
    document.getElementById('productEan').value = product.ean;
    document.getElementById('productName').value = product.nome;
    document.getElementById('productCategory').value = product.categoria;
    document.getElementById('productCost').value = product.precoCusto;
    document.getElementById('productPrice').value = product.precoVenda;
    document.getElementById('productStock').value = product.estoqueAtual;
    document.getElementById('productMinStock').value = product.estoqueMinimo;
    document.getElementById('productSupplier').value = product.fornecedor;
}

// Form submit
document.getElementById('productForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const productData = {
        ean: document.getElementById('productEan').value,
        nome: document.getElementById('productName').value,
        categoria: document.getElementById('productCategory').value,
        precoCusto: parseFloat(document.getElementById('productCost').value),
        precoVenda: parseFloat(document.getElementById('productPrice').value),
        estoqueAtual: parseInt(document.getElementById('productStock').value),
        estoqueMinimo: parseInt(document.getElementById('productMinStock').value),
        fornecedor: document.getElementById('productSupplier').value
    };
    
    try {
        const token = localStorage.getItem('authToken');
        let response;
        
        if (selectedProduct) {
            // Editar produto existente
            response = await fetch(`https://localhost:8443/api/produtos/${selectedProduct.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
        } else {
            // Criar novo produto
            response = await fetch('https://localhost:8443/api/produtos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
        }
        
        if (response.ok) {
            closeProductModal();
            loadProducts(); // Recarregar lista
            alert(selectedProduct ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
        } else {
            alert('Erro ao salvar produto');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão ao salvar produto');
    }
});

// Excluir produto
async function deleteProduct(productId) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:8443/api/produtos/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            loadProducts(); // Recarregar lista
            document.getElementById('productDetails').innerHTML = `
                <div style="text-align: center; color: #7f8c8d; padding: 2rem;">
                    Selecione um produto para visualizar os detalhes
                </div>
            `;
            alert('Produto excluído com sucesso!');
        } else {
            alert('Erro ao excluir produto');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão ao excluir produto');
    }
}

// Buscar ao pressionar Enter
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchProducts();
    }
});

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeProductModal();
    }
}

// Dados mock para teste (remover quando o backend estiver pronto)
function getMockProducts() {
    return [
        {
            id: 1,
            ean: '7891234567890',
            nome: 'Arroz Integral 5kg',
            categoria: 'Alimentos',
            precoCusto: 12.50,
            precoVenda: 18.90,
            estoqueAtual: 45,
            estoqueMinimo: 10,
            fornecedor: 'Distribuidora Alimentos SA'
        },
        {
            id: 2,
            ean: '7891234567891',
            nome: 'Feijão Carioca 1kg',
            categoria: 'Alimentos',
            precoCusto: 5.80,
            precoVenda: 8.50,
            estoqueAtual: 8,
            estoqueMinimo: 15,
            fornecedor: 'Distribuidora Alimentos SA'
        },
        {
            id: 3,
            ean: '7891234567892',
            nome: 'Sabão em Pó 1kg',
            categoria: 'Limpeza',
            precoCusto: 7.20,
            precoVenda: 12.90,
            estoqueAtual: 25,
            estoqueMinimo: 5,
            fornecedor: 'Limpex Indústria'
        }
    ];
}