
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MenuItemType, OrderItemType, MenuCategory, User } from '../types';
import { MENU_DATA } from '../data/menu';
import { getMenuRecommendation, RecommendationResponse } from '../services/geminiService';
import { CoffeeIcon, FoodIcon, StarIcon, SparklesIcon, TrashIcon, PencilIcon, PlusIcon, LogoutIcon, UserGroupIcon } from '../components/icons';

// --- Helper Functions ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// --- UI Components ---

interface MenuItemCardProps {
  item: MenuItemType;
  onAddToCart: (item: MenuItemType) => void;
  onEdit?: (item: MenuItemType) => void;
  onDelete?: (itemId: number) => void;
  isAdmin: boolean;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAddToCart, onEdit, onDelete, isAdmin }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col group">
      <div className="relative">
        <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
        {isAdmin && onEdit && onDelete && (
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={() => onEdit(item)} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-lg">
                    <PencilIcon />
                </button>
                <button onClick={() => onDelete(item.id)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg">
                    <TrashIcon />
                </button>
            </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-amber-900">{item.name}</h3>
        <p className="text-gray-600 mt-1">{formatCurrency(item.price)}</p>
        <div className="mt-auto pt-4">
          <button
            onClick={() => onAddToCart(item)}
            className="w-full bg-amber-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-900 transition-colors duration-300"
          >
            Tambah ke Pesanan
          </button>
        </div>
      </div>
    </div>
  );
};

interface OrderItemCardProps {
    item: OrderItemType;
    onRemove: (itemId: number) => void;
    onUpdateQuantity: (itemId: number, newQuantity: number) => void;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({ item, onRemove, onUpdateQuantity }) => {
    return (
        <div className="flex items-center justify-between py-2 border-b border-amber-100">
            <div>
                <p className="font-semibold text-amber-900">{item.name}</p>
                <p className="text-sm text-gray-600">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
                <input 
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value, 10))}
                    className="w-14 text-center border rounded-md"
                />
                <button onClick={() => onRemove(item.id)} className="text-red-500 hover:text-red-700">
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
}

interface OrderSummaryProps {
  order: OrderItemType[];
  onCheckout: () => void;
  onClearOrder: () => void;
  onRemoveItem: (itemId: number) => void;
  onUpdateQuantity: (itemId: number, newQuantity: number) => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ order, onCheckout, onClearOrder, onRemoveItem, onUpdateQuantity }) => {
  const total = useMemo(() => order.reduce((sum, item) => sum + item.price * item.quantity, 0), [order]);

  return (
    <div className="bg-amber-50 p-6 rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-2xl font-bold text-amber-900 mb-4">Pesanan Anda</h2>
      {order.length === 0 ? (
        <p className="text-gray-500 flex-grow flex items-center justify-center">Keranjang pesanan masih kosong.</p>
      ) : (
        <div className="flex-grow overflow-y-auto pr-2 max-h-60">
          {order.map(item => (
            <OrderItemCard key={item.id} item={item} onRemove={onRemoveItem} onUpdateQuantity={onUpdateQuantity} />
          ))}
        </div>
      )}
      {order.length > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-amber-200">
          <div className="flex justify-between items-center text-xl font-bold text-amber-900">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full bg-green-600 text-white font-bold py-3 mt-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Checkout
          </button>
           <button
            onClick={onClearOrder}
            className="w-full text-red-600 font-semibold py-2 mt-2 rounded-lg hover:bg-red-100 transition-colors"
          >
            Kosongkan Pesanan
          </button>
        </div>
      )}
    </div>
  );
};

interface AiAssistantProps {
  order: OrderItemType[];
  menu: MenuItemType[];
  onAddToCart: (item: MenuItemType) => void;
}
const AiAssistant: React.FC<AiAssistantProps> = ({ order, menu, onAddToCart }) => {
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userQuery, setUserQuery] = useState('');

  const recommendedMenuItem = useMemo(() => {
    if (!recommendation?.recommendedItemId) return null;
    return menu.find(item => item.id === recommendation.recommendedItemId);
  }, [recommendation, menu]);

  const fetchRecommendation = useCallback(async (query?: string) => {
    setIsLoading(true);
    setRecommendation(null);
    const result = await getMenuRecommendation(order, menu, query);
    setRecommendation(result);
    setIsLoading(false);
  }, [order, menu]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
        if (!userQuery) fetchRecommendation();
    }, 1500); // Debounce initial API call
    return () => clearTimeout(timer);
  }, [order, fetchRecommendation, userQuery]);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;
    fetchRecommendation(userQuery);
  };

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
        <SparklesIcon className="w-7 h-7" />
        Smart Menu Assistant
      </h2>
      <div className="bg-white p-4 rounded-lg min-h-[100px] flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="animate-pulse text-gray-500">Mencari rekomendasi...</div>
        ) : (
          <>
            <p className="text-blue-800 text-center italic mb-4">"{recommendation?.recommendationText}"</p>
            {recommendedMenuItem && (
                 <div className="w-full bg-blue-100 rounded-lg p-3 flex items-center gap-4 animate-fade-in">
                     <img src={recommendedMenuItem.imageUrl} alt={recommendedMenuItem.name} className="w-16 h-16 rounded-md object-cover"/>
                     <div className="flex-grow">
                         <p className="font-bold text-blue-900">{recommendedMenuItem.name}</p>
                         <p className="text-sm text-gray-700">{formatCurrency(recommendedMenuItem.price)}</p>
                     </div>
                     <button onClick={() => onAddToCart(recommendedMenuItem)} className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-transform transform hover:scale-110">
                         <PlusIcon className="w-5 h-5"/>
                     </button>
                 </div>
            )}
          </>
        )}
      </div>
       <form onSubmit={handleQuerySubmit} className="mt-4">
        <label htmlFor="ai-query" className="block text-sm font-medium text-blue-800 mb-1">Tanya asisten AI:</label>
        <div className="flex gap-2">
          <input 
            id="ai-query"
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="e.g., 'Minuman yang segar?'"
            className="flex-grow p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors" disabled={isLoading}>
            Tanya
          </button>
        </div>
      </form>
    </div>
  );
};

interface CheckoutModalProps {
  onClose: () => void;
}
const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-sm mx-auto">
        <h2 className="text-3xl font-bold text-green-600 mb-4">Terima Kasih!</h2>
        <p className="text-lg text-gray-700 mb-6">Pesanan kamu sudah dikirim ke dapur! 🍰</p>
        <button
          onClick={onClose}
          className="bg-amber-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-amber-900 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};

interface MenuFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Omit<MenuItemType, 'id' | 'imageUrl'> & { id?: number; imageFile?: File | null; imageUrl?: string }) => void;
    itemToEdit: MenuItemType | null;
}
const MenuFormModal: React.FC<MenuFormModalProps> = ({ isOpen, onClose, onSave, itemToEdit }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState<MenuCategory>(MenuCategory.FOOD);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        if (itemToEdit) {
            setName(itemToEdit.name);
            setPrice(String(itemToEdit.price));
            setCategory(itemToEdit.category);
            setImagePreview(itemToEdit.imageUrl);
            setImageFile(null);
        } else {
            setName('');
            setPrice('');
            setCategory(MenuCategory.FOOD);
            setImagePreview(null);
            setImageFile(null);
        }
    }, [itemToEdit, isOpen]);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) {
            alert("Nama dan Harga tidak boleh kosong.");
            return;
        }
        onSave({
            id: itemToEdit?.id,
            name,
            price: Number(price),
            category,
            imageFile,
            imageUrl: imagePreview || undefined,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{itemToEdit ? 'Edit Menu Item' : 'Tambah Menu Item Baru'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Menu</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" required />
                    </div>
                     <div className="mb-4">
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Harga</label>
                        <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategori</label>
                        <select id="category" value={category} onChange={e => setCategory(e.target.value as MenuCategory)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                           {Object.values(MenuCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Gambar Menu</label>
                         <div className="mt-1 flex items-center gap-4">
                             {imagePreview && <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-md object-cover" />}
                             <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"/>
                         </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                        <button type="submit" className="py-2 px-4 bg-amber-800 text-white rounded-md hover:bg-amber-900">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- User Management Components ---
const UserForm: React.FC<{
    userToEdit: User | null;
    onSave: (user: Omit<User, 'id' | 'password'> & { id?: number, password?: string }) => void;
    onCancel: () => void;
}> = ({ userToEdit, onSave, onCancel }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'buyer'>('buyer');

    useEffect(() => {
        if (userToEdit) {
            setUsername(userToEdit.username);
            setPassword(''); // Don't show existing password
            setRole(userToEdit.role);
        } else {
            setUsername('');
            setPassword('');
            setRole('buyer');
        }
    }, [userToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || (!userToEdit && !password)) { // Password required for new user
            alert("Username and password are required for new users.");
            return;
        }
        
        const userData: Omit<User, 'id' | 'password'> & { id?: number, password?: string } = {
            id: userToEdit?.id,
            username,
            role
        };
        if (password) {
            userData.password = password;
        }

        onSave(userData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-lg mt-4 border border-slate-200">
            <h3 className="text-xl font-semibold mb-4 text-slate-800">{userToEdit ? 'Edit User' : 'Tambah User Baru'}</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" placeholder={userToEdit ? "Kosongkan untuk menjaga password saat ini" : "Password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" required={!userToEdit} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'buyer')} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                        <option value="buyer">Buyer</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={onCancel} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Simpan User</button>
            </div>
        </form>
    );
};

const UserManagementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUser: User;
    onSaveUser: (user: Omit<User, 'id'> & { id?: number }) => void;
    onDeleteUser: (userId: number) => void;
}> = ({ isOpen, onClose, users, currentUser, onSaveUser, onDeleteUser }) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    
    useEffect(() => {
        if (!isOpen) {
            setEditingUser(null);
            setIsFormVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsFormVisible(true);
    };

    const handleAddNew = () => {
        setEditingUser(null);
        setIsFormVisible(true);
    };
    
    const handleSave = (user: Omit<User, 'id'> & { id?: number }) => {
        onSaveUser(user);
        setIsFormVisible(false);
        setEditingUser(null);
    };
    
    const handleDelete = (userId: number) => {
        if (userId === currentUser.id) {
            alert("Anda tidak bisa menghapus diri sendiri.");
            return;
        }
        if (window.confirm("Apakah Anda yakin ingin menghapus user ini?")) {
            onDeleteUser(userId);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3"><UserGroupIcon /> Kelola Pengguna</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    {!isFormVisible && (
                        <div className="flex justify-end mb-4">
                            <button onClick={handleAddNew} className="flex items-center gap-2 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <PlusIcon className="w-5 h-5" /> Tambah Pengguna Baru
                            </button>
                        </div>
                    )}
                    
                    {isFormVisible ? (
                        <UserForm 
                            userToEdit={editingUser}
                            onSave={handleSave}
                            onCancel={() => setIsFormVisible(false)}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left table-auto">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="p-3 font-semibold text-slate-600">Username</th>
                                        <th className="p-3 font-semibold text-slate-600">Role</th>
                                        <th className="p-3 font-semibold text-slate-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className="border-b hover:bg-slate-50">
                                            <td className="p-3">{user.username}</td>
                                            <td className="p-3">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-3 flex justify-end gap-2">
                                                <button title="Edit User" onClick={() => handleEdit(user)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"><PencilIcon /></button>
                                                <button 
                                                    title="Delete User"
                                                    onClick={() => handleDelete(user.id)} 
                                                    className={`p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors ${user.id === currentUser.id ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                    disabled={user.id === currentUser.id}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
interface MainPageProps {
    user: User;
    onLogout: () => void;
    users: User[];
    onSaveUser: (user: Omit<User, 'id'> & { id?: number }) => void;
    onDeleteUser: (userId: number) => void;
}

export default function MainPage({ user, onLogout, users, onSaveUser, onDeleteUser }: MainPageProps) {
  const [order, setOrder] = useState<OrderItemType[]>([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>(MenuCategory.FOOD);
  
  const isAdmin = user.role === 'admin';
  
  // CRUD State
  const [menuItems, setMenuItems] = useState<MenuItemType[]>(MENU_DATA);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const handleAddToCart = useCallback((itemToAdd: MenuItemType) => {
    setOrder(prevOrder => {
      const existingItem = prevOrder.find(item => item.id === itemToAdd.id);
      if (existingItem) {
        return prevOrder.map(item =>
          item.id === itemToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevOrder, { ...itemToAdd, quantity: 1 }];
    });
  }, []);

  const handleRemoveFromCart = useCallback((itemId: number) => {
    setOrder(prevOrder => prevOrder.filter(item => item.id !== itemId));
  }, []);

  const handleUpdateQuantity = useCallback((itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
        handleRemoveFromCart(itemId);
        return;
    }
    setOrder(prevOrder => prevOrder.map(item => item.id === itemId ? {...item, quantity: newQuantity} : item));
  }, [handleRemoveFromCart]);

  const handleClearOrder = useCallback(() => {
    setOrder([]);
  }, []);

  const handleCheckout = () => {
    if (order.length === 0) return;
    setIsCheckoutModalOpen(true);
  };
  
  const handleCloseCheckoutModal = () => {
    setIsCheckoutModalOpen(false);
    setOrder([]);
  };
  
  // --- CRUD Handlers ---
  const handleOpenAddModal = () => {
      setEditingItem(null);
      setIsFormModalOpen(true);
  }
  
  const handleOpenEditModal = (item: MenuItemType) => {
      setEditingItem(item);
      setIsFormModalOpen(true);
  }

  const handleCloseFormModal = () => {
      setIsFormModalOpen(false);
      setEditingItem(null);
  }
  
  const handleDeleteItem = useCallback((itemId: number) => {
      if (window.confirm("Apakah Anda yakin ingin menghapus item ini?")) {
        setMenuItems(prev => prev.filter(item => item.id !== itemId));
        setOrder(prev => prev.filter(item => item.id !== itemId));
      }
  }, []);

  const handleSaveItem = useCallback(async (
    itemData: Omit<MenuItemType, 'id' | 'imageUrl'> & { id?: number; imageFile?: File | null; imageUrl?: string }
  ) => {
      let finalImageUrl = itemData.imageUrl || 'https://picsum.photos/400/300';

      if (itemData.imageFile) {
        finalImageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(itemData.imageFile as Blob);
        });
      }

      const newItem: MenuItemType = {
        id: itemData.id ?? Date.now(),
        name: itemData.name,
        price: itemData.price,
        category: itemData.category,
        imageUrl: finalImageUrl,
    };

    if (itemData.id) {
        setMenuItems(prev => prev.map(item => item.id === itemData.id ? newItem : item));
    } else {
        setMenuItems(prev => [...prev, newItem]);
    }
    
    handleCloseFormModal();
  }, []);

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => item.category === activeCategory);
  }, [activeCategory, menuItems]);
  
  const categoryIcons: Record<MenuCategory, React.ReactElement> = {
      [MenuCategory.FOOD]: <FoodIcon />,
      [MenuCategory.DRINKS]: <CoffeeIcon />,
      [MenuCategory.SPECIALS]: <StarIcon />,
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      <header className="bg-amber-800 text-white shadow-lg p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">SmartCafé</h1>
          <div className="flex items-center gap-4">
             <span className="text-sm font-semibold">Halo, {user.username}! ({user.role})</span>
             {isAdmin && (
                <button onClick={() => setIsUserModalOpen(true)} className="flex items-center gap-2 py-2 px-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    <UserGroupIcon className="w-5 h-5"/>
                    Kelola User
                </button>
             )}
             <button onClick={onLogout} title="Logout" className="p-2 rounded-full hover:bg-amber-700 transition-colors">
                <LogoutIcon className="w-6 h-6"/>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex border-b-2 border-amber-200 items-center">
                {Object.values(MenuCategory).map(category => (
                    <button 
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`flex items-center gap-2 py-3 px-6 text-lg font-semibold transition-colors duration-300 ${activeCategory === category ? 'border-b-4 border-amber-800 text-amber-900' : 'text-gray-500 hover:text-amber-800'}`}
                    >
                        {categoryIcons[category]}
                        {category}
                    </button>
                ))}
                {isAdmin && (
                    <button onClick={handleOpenAddModal} className="ml-auto flex items-center gap-2 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <PlusIcon className="w-5 h-5" />
                        Tambah Item
                    </button>
                )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMenu.map(item => (
              <MenuItemCard 
                key={item.id} 
                item={item} 
                onAddToCart={handleAddToCart} 
                onEdit={handleOpenEditModal} 
                onDelete={handleDeleteItem}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <OrderSummary 
                order={order} 
                onCheckout={handleCheckout} 
                onClearOrder={handleClearOrder}
                onRemoveItem={handleRemoveFromCart}
                onUpdateQuantity={handleUpdateQuantity}
            />
            <AiAssistant order={order} menu={menuItems} onAddToCart={handleAddToCart} />
          </div>
        </div>
      </main>

      {isCheckoutModalOpen && <CheckoutModal onClose={handleCloseCheckoutModal} />}
      
      {isAdmin && <MenuFormModal 
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveItem}
        itemToEdit={editingItem}
      />}

      {isAdmin && <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        currentUser={user}
        onSaveUser={onSaveUser}
        onDeleteUser={onDeleteUser}
      />}
    </div>
  );
}
