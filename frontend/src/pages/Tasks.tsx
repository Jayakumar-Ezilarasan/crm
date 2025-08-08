import React, { useState, useEffect } from 'react';
import { Task, Customer, Lead, User } from '../types/models';
import { TaskService } from '../services/taskService';
import { CustomerService } from '../services/customerService';
import { LeadService } from '../services/leadService';
import { UserService } from '../services/userService';
import { DataTable } from '../components/ui/DataTable';
import { useAuth } from '../contexts/AuthContext';

// Interface for table data that includes JSX elements
interface TaskTableData {
  id: number;
  userId: number;
  customerId: number;
  leadId?: number;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  status: React.ReactElement;
  customerName: string;
  leadName: string;
  assignedTo: string;
  dueDateElement: React.ReactElement;
  actions: React.ReactElement | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  lead?: {
    id: number;
    stage?: {
      name: string;
    };
  };
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editFormData, setEditFormData] = useState({
    customer_id: '', lead_id: '', user_id: '', title: '', description: '', due_date: '',
  });
  const [addFormData, setAddFormData] = useState({
    customer_id: '', lead_id: '', user_id: '', title: '', description: '', due_date: '',
  });

  const { user } = useAuth();
  const currentUserId = user?.id || 1;

  // Role-based access control
  const canCreate = user?.role === 'user' || user?.role === 'manager' || user?.role === 'admin';
  const canEditOwn = true; // All users can edit their own tasks
  const canEditAll = user?.role === 'manager' || user?.role === 'admin';
  const canDeleteOwn = true; // All users can delete their own tasks
  const canDeleteAll = user?.role === 'manager' || user?.role === 'admin';
  const canViewAll = user?.role === 'manager' || user?.role === 'admin';
  const canView = true; // All authenticated users can view tasks

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Only fetch users if user can assign tasks to others
      const canAssignToOthers = user?.role === 'manager' || user?.role === 'admin';
      
      const tasksData = await (canViewAll ? TaskService.list() : TaskService.getByUser(currentUserId));
      const customersData = await CustomerService.list();
      const leadsData = await LeadService.list();
      
      setTasks(tasksData);
      setCustomers(customersData);
      setLeads(leadsData);
      
      if (canAssignToOthers) {
        const usersData = await UserService.list();
        setUsers(usersData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      setError('You do not have permission to create tasks');
      return;
    }

    // Debug: Log the form data and user info
    console.log('Creating task with data:', {
      userRole: user?.role,
      currentUserId,
      addFormData,
      assignedUserId: user?.role === 'user' ? currentUserId : parseInt(addFormData.user_id)
    });

    // Validate required fields
    if (!addFormData.customer_id || !addFormData.title || !addFormData.due_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const taskData = {
        userId: user?.role === 'user' ? currentUserId : parseInt(addFormData.user_id),
        customerId: parseInt(addFormData.customer_id),
        leadId: addFormData.lead_id ? parseInt(addFormData.lead_id) : undefined,
        title: addFormData.title,
        description: addFormData.description,
        dueDate: new Date(addFormData.due_date).toISOString(),
        completed: false,
      };
      
      console.log('Creating task with data:', taskData);
      await TaskService.create(taskData);
      setAddFormData({ 
        customer_id: '', 
        lead_id: '', 
        user_id: user?.role === 'user' ? currentUserId.toString() : '', 
        title: '', 
        description: '', 
        due_date: '' 
      });
      setShowAddModal(false);
      setSuccessMessage('Task created successfully!');
      fetchData();
    } catch (err: any) {
      console.error('Task creation error:', err);
      if (err.response?.data?.error) {
        setError(Array.isArray(err.response.data.error) 
          ? err.response.data.error.map((e: any) => e.msg).join(', ')
          : err.response.data.error);
      } else {
        setError(err.message || 'Failed to create task');
      }
    }
  };

  const handleEdit = (task: Task) => {
    const canEdit = canEditAll || (canEditOwn && task.userId === currentUserId);
    if (!canEdit) {
      setError('You do not have permission to edit this task');
      return;
    }
    setEditingTask(task);
    setEditFormData({
      customer_id: task.customerId.toString(),
      lead_id: task.leadId?.toString() || '',
      user_id: task.userId.toString(),
      title: task.title,
      description: task.description || '',
      due_date: task.dueDate.split('T')[0], // Convert to date input format
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const canEdit = canEditAll || (canEditOwn && editingTask.userId === currentUserId);
    if (!canEdit) {
      setError('You do not have permission to edit this task');
      return;
    }

    try {
      await TaskService.update(editingTask.id, {
        userId: parseInt(editFormData.user_id),
        customerId: parseInt(editFormData.customer_id),
        leadId: editFormData.lead_id ? parseInt(editFormData.lead_id) : undefined,
        title: editFormData.title,
        description: editFormData.description,
        dueDate: new Date(editFormData.due_date).toISOString(),
      });
      setShowEditModal(false);
      setEditingTask(null);
      setSuccessMessage('Task updated successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    }
  };

  const handleDelete = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const canDelete = canDeleteAll || (canDeleteOwn && task.userId === currentUserId);
    if (!canDelete) {
      setError('You do not have permission to delete this task');
      return;
    }

    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await TaskService.remove(id);
        setSuccessMessage('Task deleted successfully!');
        fetchData();
      } catch (err: any) {
        setError(err.message || 'Failed to delete task');
      }
    }
  };

  const handleToggleComplete = async (id: number, completed: boolean) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const canEdit = canEditAll || (canEditOwn && task.userId === currentUserId);
    if (!canEdit) {
      setError('You do not have permission to modify this task');
      return;
    }

    try {
      await TaskService.toggleComplete(id, completed);
      const action = completed ? 'completed' : 'marked as pending';
      const taskTitle = task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title;
      setSuccessMessage(`Task "${taskTitle}" ${action} successfully!`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    }
  };

  const getLeadDisplayName = (leadId: number | undefined) => {
    if (!leadId) return '-';
    const lead = leads.find(l => l.id === leadId);
    return lead ? `${lead.customer?.name} - ${lead.stage?.name || 'Unknown Stage'}` : 'Unknown Lead';
  };

  // Prepare data for DataTable with actions
  const tableData: TaskTableData[] = tasks.map(task => {
    const canEdit = canEditAll || (canEditOwn && task.userId === currentUserId);
    const canDelete = canDeleteAll || (canDeleteOwn && task.userId === currentUserId);
    
    return {
      id: task.id,
      userId: task.userId,
      customerId: task.customerId,
      leadId: task.leadId,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      completed: task.completed,
      status: (
        <button
          onClick={() => handleToggleComplete(task.id, !task.completed)}
          disabled={!canEdit}
          className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
            task.completed 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={canEdit ? `Click to mark as ${task.completed ? 'pending' : 'completed'}` : 'No permission to modify'}
        >
          {task.completed ? (
            <>
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Completed
            </>
          ) : (
            <>
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Pending
            </>
          )}
        </button>
      ),
      customerName: task.customer?.name || 'Unknown',
      leadName: getLeadDisplayName(task.leadId),
      assignedTo: task.user?.name || 'Unknown',
      dueDateElement: (
        <span className={new Date(task.dueDate) < new Date() && !task.completed ? 'text-red-600 font-semibold' : ''}>
          {new Date(task.dueDate).toLocaleDateString()}
        </span>
      ),
      actions: canEdit ? (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(task);
            }}
            className="text-blue-600 hover:text-blue-900 transition-colors"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(task.id);
              }}
              className="text-red-600 hover:text-red-900 transition-colors"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      ) : null,
      user: task.user,
      customer: task.customer,
      lead: task.lead,
    };
  });

  const columns = [
    { key: 'status' as keyof TaskTableData, label: 'Status', sortable: false },
    { key: 'title' as keyof TaskTableData, label: 'Title', sortable: true },
    { key: 'customerName' as keyof TaskTableData, label: 'Customer', sortable: true },
    { key: 'leadName' as keyof TaskTableData, label: 'Lead', sortable: true },
    { key: 'assignedTo' as keyof TaskTableData, label: 'Assigned To', sortable: true },
    { key: 'dueDateElement' as keyof TaskTableData, label: 'Due Date', sortable: true },
    ...(canEditAll ? [{ key: 'actions' as keyof TaskTableData, label: 'Actions', sortable: false }] : []),
  ];

  const handleRowClick = (task: Task) => {
    handleEdit(task);
  };

  if (user?.role === 'admin') {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Admin Access</h2>
          <p className="text-blue-700 mb-4">
            As an admin, you should use the Admin Panel to manage system-wide operations.
          </p>
          <button
            onClick={() => window.location.href = '/admin'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Admin Panel
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Tasks {!canViewAll && '(My Tasks)'}
        </h1>
        {canCreate && (
          <button
            onClick={() => {
              setAddFormData({ 
                customer_id: '', 
                lead_id: '', 
                user_id: user?.role === 'user' ? currentUserId.toString() : '', 
                title: '', 
                description: '', 
                due_date: '' 
              });
              setShowAddModal(true);
            }}
            className="btn-primary"
          >
            Add Task
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
          <button
            onClick={() => setSuccessMessage(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}



      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Task List ({tasks.length})</h2>
        </div>
        <div className="p-6">
          <DataTable
            columns={columns}
            data={tableData}
            loading={loading}
            error={error || undefined}
            onRowClick={handleRowClick}
            itemsPerPage={8}
          />
          </div>
      </div>

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Task</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                  <select
                    name="customer_id"
                    value={editFormData.customer_id}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead (Optional)</label>
                  <select
                    name="lead_id"
                    value={editFormData.lead_id}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Lead</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.customer?.name} - {lead.stage?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={editFormData.title}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    name="due_date"
                    value={editFormData.due_date}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {(user?.role === 'manager' || user?.role === 'admin') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
                    <select
                      name="user_id"
                      value={editFormData.user_id}
                      onChange={handleEditInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select User</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Task</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                  <select
                    name="customer_id"
                    value={addFormData.customer_id}
                    onChange={handleAddInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead (Optional)</label>
                  <select
                    name="lead_id"
                    value={addFormData.lead_id}
                    onChange={handleAddInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Lead</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.customer?.name} - {lead.stage?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={addFormData.title}
                    onChange={handleAddInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    name="due_date"
                    value={addFormData.due_date}
                    onChange={handleAddInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {(user?.role === 'manager' || user?.role === 'admin') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
                    <select
                      name="user_id"
                      value={addFormData.user_id}
                      onChange={handleAddInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select User</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={addFormData.description}
                    onChange={handleAddInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks; 