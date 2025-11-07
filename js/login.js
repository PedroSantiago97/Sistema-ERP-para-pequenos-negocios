document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.getElementById('buttonText');
    const loadingSpinner = document.getElementById('loadingSpinner');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Limpar mensagens de erro anteriores
        hideError();
        
        // Obter dados do formulário
        const login = document.getElementById('login').value.trim();
        const password = document.getElementById('password').value;
        
        // Validação básica
        if (!login || !password) {
            showError('Por favor, preencha todos os campos.');
            return;
        }
        
        // Mostrar loading
        setLoadingState(true);
        
        try {
            const response = await authenticateUser(login, password);
            
            if (response.token) {
                // Login bem-sucedido
                handleSuccessfulLogin(response);
            } else {
                // Login falhou
                showError(response.message || 'Credenciais inválidas.');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            showError('Erro de conexão. Tente novamente.');
        } finally {
            // Esconder loading
            setLoadingState(false);
        }
    });

    // Função para autenticar usuário
    async function authenticateUser(login, password) {
        const API_URL = 'https://localhost:8443/auth/login';
        
        const loginData = {
            login: login,
            password: password
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        if (!response.ok) {
            // Se a resposta não for OK, tentar extrair mensagem de erro
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        return await response.json();
    }

    // Função para lidar com login bem-sucedido
    // Função para lidar com login bem-sucedido
    // Função para lidar com login bem-sucedido
    function handleSuccessfulLogin(response) {
        console.log('Login bem-sucedido - RESPOSTA COMPLETA:', response);
        
        // Salvar token JWT
        const token = response.token || response.access_token || response.jwt;
        if (token) {
            localStorage.setItem('authToken', token);
            console.log('Token salvo:', token);
        }
        
        // Salvar dados do usuário - verificar diferentes estruturas possíveis
        const userData = response.user || response.usuario || response.data || response;
        console.log('UserData para salvar:', userData);
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        // DEBUG: Ver todos os campos disponíveis no userData
        console.log('Todos os campos do userData:');
        for (let key in userData) {
            console.log(`- ${key}: ${userData[key]}`);
        }
        
        // Verificar se o login é "gerenciador" - testar diferentes campos
        const userLogin = userData.login || userData.username || userData.email || userData.nome || userData.usuario;
        console.log('Login extraído:', userLogin);
        console.log('Valor do campo login do formulário:', document.getElementById('login').value);
        
        // Comparar com o valor que foi digitado no formulário também
        const formLogin = document.getElementById('login').value.trim().toLowerCase();
        console.log('Login do formulário (normalizado):', formLogin);
        
        const isGerenciador = userLogin === 'gerenciador' || formLogin === 'gerenciador';
        console.log('É gerenciador?', isGerenciador);
        
        if (isGerenciador) {
            console.log('REDIRECIONANDO: loading.html → dashboard.html');
            window.location.href = 'loading.html'; // Vai para dashboard (admin)
        } else {
            console.log('REDIRECIONANDO: pdv.html');
            window.location.href = 'pdv.html'; // Vai direto para o PDV (usuário comum)
        }
    }

    // Função para mostrar mensagem de erro
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Focar no campo de login
        document.getElementById('login').focus();
    }

    // Função para esconder mensagem de erro
    function hideError() {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }

    // Função para controlar estado de loading
    function setLoadingState(isLoading) {
        if (isLoading) {
            loginButton.disabled = true;
            buttonText.style.display = 'none';
            loadingSpinner.style.display = 'inline-block';
        } else {
            loginButton.disabled = false;
            buttonText.style.display = 'inline-block';
            loadingSpinner.style.display = 'none';
        }
    }

    // Limpar mensagens de erro ao digitar
    document.getElementById('login').addEventListener('input', hideError);
    document.getElementById('password').addEventListener('input', hideError);
});