'use client'

import { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { useRouter } from 'next/navigation';
import debounce from 'lodash.debounce';

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

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Use useCallback for debounced fetchItems to avoid re-creating the function
  const fetchItems = useCallback(async (
    term: string = searchTerm,
    min: string = minPrice,
    max: string = maxPrice
  ) => {
    setError(''); // Clear previous errors
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (term) {
        queryParams.append('name', term);
      }
      if (min) {
        queryParams.append('minPrice', min);
      }
      if (max) {
        queryParams.append('maxPrice', max);
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
  }, [searchTerm, minPrice, maxPrice]); // Dependencies for useCallback

  // Debounced version of fetchItems for the search input
  const debouncedFetchItems = useCallback(debounce(fetchItems, 500), [fetchItems]); // Debounce with 500ms delay

  // Redirect and initial fetch
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('auth') !== 'true') {
      router.push('/login');
    } else {
      // Initial fetch without filters on page load
      fetchItems('', '', '');
    }
  }, [router, fetchItems]); // Added fetchItems to dependency array

  // Effect to refetch items when filters change (except for search term, which is debounced)
   useEffect(() => {
    // Only trigger refetch for price filters when they change
    if (minPrice !== '' || maxPrice !== '') {
        fetchItems();
    } else if (minPrice === '' && maxPrice === '' && searchTerm === '' && items.length > 0) {
         // If all filters are cleared and items are already loaded, refetch to get all items
        fetchItems();
    } else if (minPrice === '' && maxPrice === '' && searchTerm === '' && items.length === 0 && !loading) {
        // If all filters are cleared and no items are loaded, and not currently loading, fetch
         fetchItems();
    }
   }, [minPrice, maxPrice, fetchItems]); // Dependencies include price filters and fetchItems


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(''); // Clear previous errors

    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity, 10) // Use radix 10
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

      // Clear form and reset edit mode
      setForm({ name: '', description: '', price: '', quantity: '' });
      setEditMode(false);
      setEditId(null);
      fetchItems(); // Refresh the list with current filters
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
    setError(''); // Clear previous errors
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/items/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
         const errorData = await res.json();
         throw new Error(errorData.message || 'Failed to delete item');
      }

      fetchItems(); // Refresh the list with current filters
    } catch (e: any) {
      setError(`Failed to delete item: ${e.message}`);
    }
  }

  const handleEdit = (item: Item) => {
    setError(''); // Clear previous errors
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth');
      router.push('/login');
    }
  }

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedFetchItems(term, minPrice, maxPrice); // Pass current filter values
  };

   // Handle price filter changes (not debounced, usually triggered by blur or explicit action)
   const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === 'minPrice') {
         setMinPrice(value);
      } else {
         setMaxPrice(value);
      }
      // fetchItems is called via the useEffect dependency on minPrice/maxPrice
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
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
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

        {/* Filter Section */}
        <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-inner">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Filter Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                    <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search by Name:</label>
                    <input
                        id="searchTerm"
                        type="text"
                        placeholder="e.g., Laptop, Mouse"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:focus:ring-blue-600 dark:focus:border-blue-600"
                         aria-label="Search by Item Name"
                    />
                </div>
                <div className="md:col-span-3 grid grid-cols-2 gap-4">
                     <div>
                         <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Price:</label>
                         <input
                            id="minPrice"
                            type="number"
                            name="minPrice"
                            placeholder="e.g., 10.00"
                            value={minPrice}
                            onChange={handlePriceChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            min="0"
                             step="0.01"
                             aria-label="Minimum Price"
                         />
                     </div>
                     <div>
                        <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Price:</label>
                         <input
                            id="maxPrice"
                            type="number"
                            name="maxPrice"
                            placeholder="e.g., 100.00"
                            value={maxPrice}
                            onChange={handlePriceChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            min="0"
                             step="0.01"
                             aria-label="Maximum Price"
                         />
                     </div>
                </div>
            </div>
        </div>


        <div className="mb-8">
           <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
             Inventory Items
          </h2>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-300 text-center">Loading items...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-500 italic text-center">No items found with the current filters.</p>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
              required
              min="0" // Added min attribute
              step="0.01" // Added step for decimal prices
              aria-label="Item Price"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
              required
              min="0" // Added min attribute
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
                    setError(''); // Clear error on cancel
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