// frontend/src/components/GroceryList.js
import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import axiosInstance from '../utils/axios';
import { FiPlus, FiCheck, FiX, FiShoppingCart, FiEdit2, FiTrash2 } from 'react-icons/fi';

const GroceryList = () => {
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
    { value: 'seafood', label: 'Seafood', icon: '🐟' },
    { value: 'bakery', label: 'Bakery', icon: '🍞' },
    { value: 'frozen', label: 'Frozen', icon: '🧊' },
    { value: 'pantry', label: 'Pantry', icon: '🥫' },
    { value: 'beverages', label: 'Beverages', icon: '🥤' },
    { value: 'snacks', label: 'Snacks', icon: '🍿' },
    { value: 'household', label: 'Household', icon: '🧹' },
    { value: 'personal care', label: 'Personal Care', icon: '🧴' },
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
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '📦';
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Grocery List</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-4 mb-6">
        {categories.map(category => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === category.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Active Items */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiShoppingCart className="w-5 h-5 mr-2" />
          Shopping List ({filteredItems.length})
        </h3>
        
        {filteredItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {selectedCategory === 'all' 
              ? 'No items in your shopping list' 
              : 'No items in this category'}
          </p>
        ) : (
          <div className="grid gap-3">
            {filteredItems.map(item => (
              <div
                key={item._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => handleToggleComplete(item)}
                    className="mt-1 w-5 h-5 rounded border-2 border-gray-300 hover:border-blue-500 flex items-center justify-center flex-shrink-0"
                  >
                    {item.completed && <FiCheck className="w-3 h-3 text-blue-600" />}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                          <span>{getCategoryIcon(item.category)}</span>
                          <span>{item.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        </h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span>{item.quantity} {item.unit}</span>
                          {item.assignedTo && (
                            <span className="flex items-center space-x-1">
                              <span>Assigned to:</span>
                              <span className="font-medium">{item.assignedTo.fullName}</span>
                            </span>
                          )}
                          {item.recurring && (
                            <span className="text-blue-600">🔄 {item.recurringFrequency}</span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiCheck className="w-5 h-5 mr-2" />
            Recently Completed ({completedItems.length})
          </h3>
          
          <div className="grid gap-2">
            {completedItems.slice(0, 5).map(item => (
              <div
                key={item._id}
                className="bg-gray-50 rounded-lg p-3 opacity-60"
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleComplete(item)}
                    className="w-5 h-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0"
                  >
                    <FiCheck className="w-3 h-3 text-white" />
                  </button>
                  
                  <div className="flex-1">
                    <span className="line-through text-gray-600">
                      {getCategoryIcon(item.category)} {item.name} - {item.quantity} {item.unit}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      by {item.completedBy?.fullName}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingItem ? 'Edit Item' : 'Add Item'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any specific brand, store, etc."
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                  Recurring item
                </label>
                {formData.recurring && (
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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