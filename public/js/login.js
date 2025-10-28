document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        // Verificar el tipo de contenido de la respuesta
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('La respuesta no es JSON válido');
        }
        const data = await response.json();

        if (data.success) {
            window.location.href = '/views/inicio/panel_control.html';
        } else {
            alert(data.message || 'Error de autenticación');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        alert('Error al conectar con el servidor. Por favor, intente más tarde.');
    }
});