import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { getUserById, updateUser, deleteUser, getUserPosts, searchUsers, register, login} from '../controllers/userController';

const router = Router();

const upload = multer({ dest: 'uploads/' });

router.post('/register', register);
router.post('/login', login);

router.get('/search', authenticate, searchUsers);
router.get('/:id', getUserById);
router.get('/:id/posts', getUserPosts);

router.put('/:id', authenticate, upload.single('profilePicture'), updateUser);
router.delete('/:id', authenticate, deleteUser);

export default router;