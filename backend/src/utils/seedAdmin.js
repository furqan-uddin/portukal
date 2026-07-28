import Admin from '../models/Admin.model.js';

export const seedDefaultAdmin = async () => {
    try {
        const existingAdmin = await Admin.findOne({ email: 'admin@admin.com' });
        if (!existingAdmin) {
            const admin = new Admin({
                name: 'Super Admin',
                email: 'admin@admin.com',
                password: 'admin123',
                role: 'superadmin',
                isActive: true,
            });
            await admin.save();
            console.log('✅ Default Admin account created (admin@admin.com / admin123)');
        }
    } catch (err) {
        console.error('❌ Failed to seed default admin account:', err.message);
    }
};
