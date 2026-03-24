import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getUserById, updateUser, deleteUser, searchUsers } from '../controllers/userController';

const router = Router();

router.get('/search', authenticate, searchUsers);
router.get('/:id', getUserById);
router.put('/:id', authenticate, upload.single('profilePicture'), updateUser);
router.delete('/:id', authenticate, deleteUser);

export default router;