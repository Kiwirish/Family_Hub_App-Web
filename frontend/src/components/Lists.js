import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import axiosInstance from '../utils/axios';
import { Link } from 'react-router-dom';
import { 
  FiPlus, FiCheck, FiX, FiList, FiEdit2, FiTrash2,
  FiArrowLeft, FiMoreVertical, FiClock, FiUser,
  FiChevronRight, FiStar, FiArchive
} from 'react-icons/fi';

const Lists = () => {
  const { socket } = useSocket();
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  
  const [listFormData, setListFormData] = useState({
    title: '',
    description: '',
    color: '#f97316', // Orange as default
    icon: '📝'
  });

  const [itemFormData, setItemFormData] = useState({
    text: '',
    assignedTo: '',
    dueDate: '',
    priority: 'normal'
  });

  const listIcons = ['📝', '🎯', '💡', '🎮', '🎬', '📚', '🎨', '🏠', '💰', '🎁'];
  const listColors = [
    { name: 'Orange', value: '#f97316' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Amber', value: '#f59e0b' }
  ];

  useEffect(() => {
    fetchLists();
    fetchFamilyMembers();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('list_created', (list) => {
        setLists(prev => [...prev, list]);
      });

      socket.on('list_updated', (updatedList) => {
        setLists(prev => prev.map(list => 
          list._id === updatedList._id ? updatedList : list
        ));
        if (selectedList?._id === updatedList._id) {
          setSelectedList(updatedList);
        }
      });

      socket.on('list_deleted', (listId) => {
        setLists(prev => prev.filter(list => list._id !== listId));
        if (selectedList?._id === listId) {
          setSelectedList(null);
        }
      });

      socket.on('list_item_added', ({ listId, item }) => {
        if (selectedList?._id === listId) {
          setSelectedList(prev => ({
            ...prev,
            items: [...prev.items, item]
          }));
        }
      });

      socket.on('list_item_updated', ({ listId, item }) => {
        if (selectedList?._id === listId) {
          setSelectedList(prev => ({
            ...prev,
            items: prev.items.map(i => i._id === item._id ? item : i)
          }));
        }
      });

      socket.on('list_item_deleted', ({ listId, itemId }) => {
        if (selectedList?._id === listId) {
          setSelectedList(prev => ({
            ...prev,
            items: prev.items.filter(i => i._id !== itemId)
          }));
        }
      });

      return () => {
        socket.off('list_created');
        socket.off('list_updated');
        socket.off('list_deleted');
        socket.off('list_item_added');
        socket.off('list_item_updated');
        socket.off('list_item_deleted');
      };
    }
  }, [socket, selectedList]);

  const fetchLists = async () => {
    try {
      const response = await axiosInstance.get('/lists');
      setLists(response.data.lists);
      if (response.data.lists.length > 0 && !selectedList) {
        setSelectedList(response.data.lists[0]);
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error);
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

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/lists', listFormData);
      setSelectedList(response.data.list);
      resetListForm();
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleUpdateList = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/lists/${editingList._id}`, listFormData);
      resetListForm();
    } catch (error) {
      console.error('Failed to update list:', error);
    }
  };

  const handleDeleteList = async (listId) => {
    if (window.confirm('Are you sure you want to delete this list and all its items?')) {
      try {
        await axiosInstance.delete(`/lists/${listId}`);
      } catch (error) {
        console.error('Failed to delete list:', error);
      }
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(`/lists/${selectedList._id}/items`, itemFormData);
      resetItemForm();
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleToggleItem = async (itemId, completed) => {
    try {
      await axiosInstance.put(`/lists/${selectedList._id}/items/${itemId}`, { 
        completed: !completed 
      });
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await axiosInstance.delete(`/lists/${selectedList._id}/items/${itemId}`);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const resetListForm = () => {
    setListFormData({
      title: '',
      description: '',
      color: '#f97316',
      icon: '📝'
    });
    setEditingList(null);
    setShowCreateModal(false);
  };

  const resetItemForm = () => {
    setItemFormData({
      text: '',
      assignedTo: '',
      dueDate: '',
      priority: 'normal'
    });
    setEditingItem(null);
    setShowAddItemModal(false);
  };

  const startEditList = (list) => {
    setListFormData({
      title: list.title,
      description: list.description || '',
      color: list.color,
      icon: list.icon
    });
    setEditingList(list);
    setShowCreateModal(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-700 bg-red-50 border-red-200';
      case 'normal': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'low': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lists...</p>
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
                <h1 className="text-xl font-bold text-gray-900">Lists</h1>
                <p className="text-sm text-gray-500">Create and manage custom lists</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <FiPlus className="w-4 h-4" />
              <span>New List</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Lists Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">My Lists</h2>
              </div>
              <div className="p-2">
                {lists.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No lists yet</p>
                ) : (
                  <div className="space-y-1">
                    {lists.map((list) => (
                      <button
                        key={list._id}
                        onClick={() => setSelectedList(list)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between group ${
                          selectedList?._id === list._id
                            ? 'bg-orange-50 text-orange-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span 
                            className="text-xl flex-shrink-0"
                            style={{ color: list.color }}
                          >
                            {list.icon}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{list.title}</p>
                            <p className="text-xs text-gray-500">
                              {list.items?.filter(i => !i.completed).length || 0} items
                            </p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditList(list);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="lg:col-span-3">
            {selectedList ? (
              <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div 
                        className="text-4xl"
                        style={{ color: selectedList.color }}
                      >
                        {selectedList.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedList.title}</h2>
                        {selectedList.description && (
                          <p className="text-gray-600 mt-1">{selectedList.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{selectedList.items?.length || 0} total items</span>
                          <span>{selectedList.items?.filter(i => i.completed).length || 0} completed</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowAddItemModal(true)}
                        className="px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-1"
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>Add Item</span>
                      </button>
                      <button
                        onClick={() => handleDeleteList(selectedList._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {selectedList.items?.length === 0 ? (
                    <div className="p-12 text-center">
                      <FiList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No items in this list yet</p>
                      <button
                        onClick={() => setShowAddItemModal(true)}
                        className="mt-4 text-orange-600 hover:text-orange-700 font-medium text-sm"
                      >
                        Add your first item →
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Active Items */}
                      {selectedList.items?.filter(item => !item.completed).map((item) => (
                        <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <button
                              onClick={() => handleToggleItem(item._id, item.completed)}
                              className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 hover:border-orange-500 transition-colors flex items-center justify-center flex-shrink-0"
                            >
                              {item.completed && <FiCheck className="w-3 h-3 text-orange-600" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.text}</p>
                                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                                    {item.assignedTo && (
                                      <span className="flex items-center space-x-1">
                                        <FiUser className="w-3.5 h-3.5" />
                                        <span>{item.assignedTo.fullName}</span>
                                      </span>
                                    )}
                                    {item.dueDate && (
                                      <span className="flex items-center space-x-1">
                                        <FiClock className="w-3.5 h-3.5" />
                                        <span>{new Date(item.dueDate).toLocaleDateString()}</span>
                                      </span>
                                    )}
                                    {item.priority !== 'normal' && (
                                      <span className={`text-xs px-2 py-0.5 rounded-md border ${getPriorityColor(item.priority)}`}>
                                        {item.priority}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeleteItem(item._id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all ml-4"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Completed Items */}
                      {selectedList.items?.filter(item => item.completed).length > 0 && (
                        <>
                          <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-600">
                            Completed ({selectedList.items.filter(item => item.completed).length})
                          </div>
                          {selectedList.items.filter(item => item.completed).map((item) => (
                            <div key={item._id} className="p-4 opacity-60">
                              <div className="flex items-start space-x-3">
                                <button
                                  onClick={() => handleToggleItem(item._id, item.completed)}
                                  className="mt-0.5 w-5 h-5 rounded border-2 border-orange-500 bg-orange-500 flex items-center justify-center flex-shrink-0"
                                >
                                  <FiCheck className="w-3 h-3 text-white" />
                                </button>

                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-500 line-through">{item.text}</p>
                                </div>

                                <button
                                  onClick={() => handleDeleteItem(item._id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 transition-all"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 p-12">
                <div className="text-center">
                  <FiList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No list selected</h3>
                  <p className="text-gray-500 mb-4">Create a new list or select an existing one</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
                  >
                    Create Your First List
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create/Edit List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingList ? 'Edit List' : 'Create New List'}
            </h3>
            
            <form onSubmit={editingList ? handleUpdateList : handleCreateList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  List Name
                </label>
                <input
                  type="text"
                  value={listFormData.title}
                  onChange={(e) => setListFormData({ ...listFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Birthday Ideas, Travel Plans..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={listFormData.description}
                  onChange={(e) => setListFormData({ ...listFormData, description: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  placeholder="What's this list for?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {listIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setListFormData({ ...listFormData, icon })}
                      className={`p-3 text-2xl rounded-lg border-2 transition-all ${
                        listFormData.icon === icon
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {listColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setListFormData({ ...listFormData, color: color.value })}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center ${
                        listFormData.color === color.value
                          ? 'border-gray-400'
                          : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color.value + '20' }}
                    >
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetListForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
                >
                  {editingList ? 'Save Changes' : 'Create List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && selectedList && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Add Item to {selectedList.title}
            </h3>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Text
                </label>
                <input
                  type="text"
                  value={itemFormData.text}
                  onChange={(e) => setItemFormData({ ...itemFormData, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  value={itemFormData.assignedTo}
                  onChange={(e) => setItemFormData({ ...itemFormData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">No one</option>
                  {familyMembers.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={itemFormData.dueDate}
                  onChange={(e) => setItemFormData({ ...itemFormData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'normal', 'high'].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setItemFormData({ ...itemFormData, priority })}
                      className={`py-2 rounded-lg font-medium capitalize transition-colors ${
                        itemFormData.priority === priority
                          ? priority === 'high' ? 'bg-red-100 text-red-700 border border-red-200' :
                            priority === 'normal' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            'bg-gray-100 text-gray-700 border border-gray-200'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lists;