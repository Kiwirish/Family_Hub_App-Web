import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import axiosInstance from '../utils/axios';
import { Link } from 'react-router-dom';
import { 
  FiPlus, FiCheck, FiX, FiShoppingCart, FiEdit2, FiTrash2,
  FiArrowLeft, FiFilter, FiClock, FiUser, FiRepeat,
  FiPackage, FiMoreVertical
} from 'react-icons/fi';

const GroceryList = ({ setGroceryCount }) => {
  const { socket } = useSocket();
  const [items, setItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [familyMembers, setFamilyMembers] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unit: 'piece',
    category: 'other',
    priority: 'medium',
    notes: '',
    assignedTo: '',
    recurring: false,
    recurringFrequency: 'weekly'
  });

  const categories = [
    { value: 'all', label: 'All Items', icon: '🛒' },
    { value: 'produce', label: 'Produce', icon: '🥬' },
    { value: 'dairy', label: 'Dairy', icon: '🥛' },
    { value: 'meat', label: 'Meat', icon: '🥩' },
    { value: 'bakery', label: 'Bakery', icon: '🍞' },
    { value: 'pantry', label: 'Pantry', icon: '🥫' },
    { value: 'household', label: 'Household', icon: '🧹' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  const units = [
    'piece', 'kg', 'g', 'l', 'ml', 'dozen', 'pack', 'bottle', 'can', 'box', 'bag'
  ];

  useEffect(() => {
    fetchItems();
    fetchFamilyMembers();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('grocery_item_added', (item) => {
        setItems(prev => [item, ...prev]);
      });

      socket.on('grocery_item_updated', (updatedItem) => {
        if (updatedItem.completed) {
          setItems(prev => prev.filter(item => item._id !== updatedItem._id));
          setCompletedItems(prev => [updatedItem, ...prev]);
        } else {
          setCompletedItems(prev => prev.filter(item => item._id !== updatedItem._id));
          setItems(prev => [updatedItem, ...prev.filter(item => item._id !== updatedItem._id)]);
        }
      });

      socket.on('grocery_item_deleted', (itemId) => {
        setItems(prev => prev.filter(item => item._id !== itemId));
        setCompletedItems(prev => prev.filter(item => item._id !== itemId));
      });

      return () => {
        socket.off('grocery_item_added');
        socket.off('grocery_item_updated');
        socket.off('grocery_item_deleted');
      };
    }
  }, [socket]);

  const fetchItems = async () => {
    try {
      const [activeResponse, completedResponse] = await Promise.all([
        axiosInstance.get('/grocery?completed=false'),
        axiosInstance.get('/grocery?completed=true')
      ]);
      
      setItems(activeResponse.data.items);
      setCompletedItems(completedResponse.data.items);
    } catch (error) {
      console.error('Failed to fetch grocery items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const response = await axiosInstance.get('/family/members');
      setFamilyMembers(response.data.members);
    } catch (error) {
      console.error('Failed to fetch family members:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await axiosInstance.put(`/grocery/${editingItem._id}`, formData);
      } else {
        await axiosInstance.post('/grocery', formData);
      }
      
      resetForm();
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save item');
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      await axiosInstance.put(`/grocery/${item._id}`, { 
        completed: !item.completed 
      });
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axiosInstance.delete(`/grocery/${itemId}`);
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: '1',
      unit: 'piece',
      category: 'other',
      priority: 'medium',
      notes: '',
      assignedTo: '',
      recurring: false,
      recurringFrequency: 'weekly'
    });
    setEditingItem(null);
    setShowAddModal(false);
  };

  const startEdit = (item) => {
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      priority: item.priority,
      notes: item.notes || '',
      assignedTo: item.assignedTo?._id || '',
      recurring: item.recurring,
      recurringFrequency: item.recurringFrequency
    });
    setEditingItem(item);
    setShowAddModal(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-700 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '📦';
  };
  
  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  useEffect(() => {
    const filtered = selectedCategory === 'all' 
      ? items 
      : items.filter(item => item.category === selectedCategory);
    setGroceryCount?.(filtered.length);
  }, [items, selectedCategory, setGroceryCount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shopping list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                  <FiArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Grocery List</h1>
                <p className="text-sm text-gray-500">Manage your shopping needs</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Category Filter */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.value
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
                {selectedCategory === category.value && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-medium">
                    {category.value === 'all' ? items.length : items.filter(item => item.category === category.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiShoppingCart className="w-5 h-5 mr-2 text-emerald-600" />
                  Shopping List
                  <span className="ml-auto text-sm font-normal text-gray-500">
                    {filteredItems.length} items
                  </span>
                </h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {filteredItems.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-4xl mb-4">{getCategoryIcon(selectedCategory)}</div>
                    <p className="text-gray-500">
                      {selectedCategory === 'all' 
                        ? 'Your shopping list is empty' 
                        : 'No items in this category'}
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                    >
                      Add your first item →
                    </button>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => handleToggleComplete(item)}
                          className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 hover:border-emerald-500 transition-colors flex items-center justify-center flex-shrink-0"
                        >
                          {item.completed && <FiCheck className="w-3 h-3 text-emerald-600" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-lg">{getCategoryIcon(item.category)}</span>
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-md border ${getPriorityColor(item.priority)}`}>
                                  {item.priority}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <FiPackage className="w-3.5 h-3.5" />
                                  <span>{item.quantity} {item.unit}</span>
                                </span>
                                
                                {item.assignedTo && (
                                  <span className="flex items-center space-x-1">
                                    <FiUser className="w-3.5 h-3.5" />
                                    <span>{item.assignedTo.fullName}</span>
                                  </span>
                                )}
                                
                                {item.recurring && (
                                  <span className="flex items-center space-x-1 text-indigo-600">
                                    <FiRepeat className="w-3.5 h-3.5" />
                                    <span>{item.recurringFrequency}</span>
                                  </span>
                                )}
                              </div>
                              
                              {item.notes && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {item.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center space-x-1 ml-4">
                              <button
                                onClick={() => startEdit(item)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item._id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Completed Items */}
          <div>
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <FiCheck className="w-5 h-5 mr-2 text-gray-400" />
                  Recently Completed
                  <span className="ml-auto text-sm font-normal text-gray-500">
                    {completedItems.length}
                  </span>
                </h3>
              </div>
              
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {completedItems.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No completed items</p>
                ) : (
                  completedItems.slice(0, 10).map((item) => (
                    <div key={item._id} className="flex items-center space-x-3 py-2">
                      <button
                        onClick={() => handleToggleComplete(item)}
                        className="w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center flex-shrink-0"
                      >
                        <FiCheck className="w-3 h-3 text-white" />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500 line-through truncate">
                          {getCategoryIcon(item.category)} {item.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          by {item.completedBy?.fullName}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Milk, Bread, Apples..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {categories.filter(c => c.value !== 'all').map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority })}
                      className={`py-2 rounded-lg font-medium capitalize transition-colors ${
                        formData.priority === priority
                          ? priority === 'high' ? 'bg-red-100 text-red-700 border border-red-200' :
                            priority === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Anyone</option>
                  {familyMembers.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  placeholder="Any specific brand, store, or other details..."
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                  Recurring item
                </label>
                {formData.recurring && (
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                >
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroceryList;