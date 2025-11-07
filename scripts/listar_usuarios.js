const connection = require('../src/config/connection');

async function listarUsuarios() {
    try {
        const [usuarios] = await connection.execute(
            'SELECT id_usuario, username, nombre, estado, rol_fk, LENGTH(password) as pass_length, SUBSTRING(password, 1, 10) as pass_preview FROM usuarios'
        );

        console.log('\n📋 Usuarios en la base de datos:\n');
        usuarios.forEach(u => {
            console.log('─────────────────────────────────');
            console.log('ID:', u.id_usuario);
            console.log('Username:', u.username);
            console.log('Nombre:', u.nombre);
            console.log('Estado:', u.estado);
            console.log('Rol:', u.rol_fk === 1 ? 'Admin' : 'Cliente');
            console.log('Password length:', u.pass_length);
            console.log('Password preview:', u.pass_preview);
            console.log('Hash válido:', u.pass_preview.startsWith('$2') ? '✅' : '❌');
        });
        console.log('─────────────────────────────────\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listarUsuarios();