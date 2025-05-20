'use client'

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Item = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  createdAt: string;
}

export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: ''
  });

  const [inputMinPrice, setInputMinPrice] = useState('');
  const [inputMaxPrice, setInputMaxPrice] = useState('');

  const [currentMinPrice, setCurrentMinPrice] = useState('');
  const [currentMaxPrice, setCurrentMaxPrice] = useState('');


  const fetchItems = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (currentMinPrice) {
        queryParams.append('minPrice', currentMinPrice);
      }
      if (currentMaxPrice) {
        queryParams.append('maxPrice', currentMaxPrice);
      }

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/items?${queryParams.toString()}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setItems(data);
    } catch (e: any) {
      setError(`Failed to load items: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentMinPrice, currentMaxPrice]);

  const applyFilters = () => {
    setCurrentMinPrice(inputMinPrice);
    setCurrentMaxPrice(inputMaxPrice);
  };

  const clearFilters = () => {
    setInputMinPrice('');
    setInputMaxPrice('');
    setCurrentMinPrice('');
    setCurrentMaxPrice('');
  };

  useEffect(() => {
    if (localStorage.getItem('auth') !== 'true') {
      router.push('/login');
    } else {
      fetchItems();
    }
  }, [router, fetchItems]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');

    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity, 10)
    }

    try {
      const url = editMode
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/items/${editId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/items`;

      const method = editMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save item');
      }

      setForm({ name: '', description: '', price: '', quantity: '' });
      setEditMode(false);
      setEditId(null);
      fetchItems();
    } catch (e: any) {
      setError(editMode ? `Failed to update item: ${e.message}` : `Failed to add item: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/items/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete item');
      }

      fetchItems();
    } catch (e: any) {
      setError(`Failed to delete item: ${e.message}`);
    }
  }

  const handleEdit = (item: Item) => {
    setError('');
    setEditMode(true);
    setEditId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      quantity: item.quantity.toString(),
    });
  }

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  }

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'minPrice') {
      setInputMinPrice(value);
    } else {
      setInputMaxPrice(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-teal-400 py-10 font-sans">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Inventory Manager</h1>
            <p className="text-base text-gray-500 dark:text-gray-400">Manage your item stock below</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200 ease-in-out"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 dark:bg-red-900 dark:text-red-300 dark:border-red-700" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-inner">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Filter Items by Price</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Price:</label>
              <input
                id="minPrice"
                type="number"
                name="minPrice"
                placeholder="e.g., 10.00"
                value={inputMinPrice}
                onChange={handlePriceInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Price:</label>
              <input
                id="maxPrice"
                type="number"
                name="maxPrice"
                placeholder="e.g., 100.00"
                value={inputMaxPrice}
                onChange={handlePriceInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              onClick={applyFilters}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Inventory Items
          </h2>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-300 text-center">Loading items...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-500 italic text-center">No items found with the current filters. Try adjusting your price range or add new items!</p>
          ) : (
            <ul className="space-y-4">
              {items.map(item => (
                <li key={item.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition duration-200 ease-in-out">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="mr-4">
                          <span className="font-medium">Price:</span> ${item.price.toFixed(2)}
                        </span>
                        <span>
                          <span className="font-medium">Quantity:</span> {item.quantity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Added: {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-yellow-500 text-white px-3 py-1 text-sm rounded-md hover:bg-yellow-600 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                        aria-label={`Edit ${item.name}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-500 text-white px-3 py-1 text-sm rounded-md hover:bg-red-600 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                        aria-label={`Delete ${item.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
            {editMode ? 'Edit Item' : 'Add New Item'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
              required
              aria-label="Item Name"
            />
            <input
              type="text"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
              required
              aria-label="Item Description"
            />
            <input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              min="0"
              step="0.01"
              aria-label="Item Price"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              required
              min="0"
              aria-label="Item Quantity"
            />

            <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 mt-2">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full sm:w-auto flex-1 text-white py-2 px-4 rounded-md transition duration-200 ease-in-out focus:outline-none focus:ring-2 ${
                  submitting
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 focus:ring-green-500 focus:ring-opacity-50'
                }`}
              >
                {submitting
                  ? editMode
                    ? 'Saving...'
                    : 'Adding...'
                  : editMode
                    ? 'Save Changes'
                    : 'Add Item'}
              </button>

              {editMode && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setEditMode(false)
                    setEditId(null)
                    setForm({ name: '', description: '', price: '', quantity: '' })
                    setError('');
                  }}
                  className={`w-full sm:w-auto flex-1 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md transition duration-200 ease-in-out focus:outline-none focus:ring-2 ${
                    submitting
                      ? 'bg-gray-200 dark:bg-gray-500 cursor-not-allowed'
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 focus:ring-gray-400 focus:ring-opacity-50'
                  }`}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}