import { useEffect, useMemo, useRef, useState } from 'react';
import AdminNavbar from '../Components/adminNavbar';
import { addBook, deleteBook, editBook, fetchAllBooks } from '../adminAPI';
import { useNotification } from '../../context/Notification';

const initialForm = {
  title:       '',
  author:      '',
  category:    '',
  description: '',
  pdfUrl:      '',
  coverImage:  '',
  isPaid:      false,
  price:       0,
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

const AdminBook = () => {
  const notify = useNotification();
  const [books, setBooks]           = useState([]);
  const [form, setForm]             = useState(initialForm);
  const [editingId, setEditingId]   = useState('');
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [imgError, setImgError]     = useState(false);

  // File preview states
  const [coverPreview, setCoverPreview] = useState(''); // base64 or URL
  const [pdfName, setPdfName]           = useState(''); // selected PDF filename

  // Hidden file input refs
  const imageInputRef = useRef(null);
  const pdfInputRef   = useRef(null);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const loadBooks = async () => {
    try {
      const { data } = await fetchAllBooks();
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load books';
      setError(message);
      notify.error('Book Load Error', message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadBooks(); }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId('');
    setImgError(false);
    setCoverPreview('');
    setPdfName('');
    // Clear file inputs
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (pdfInputRef.current)   pdfInputRef.current.value   = '';
  };

  const onChange = (e) => {
    const { name, type, checked, value } = e.target;
    setImgError(false);

    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked, price: checked ? prev.price : 0 }));
      return;
    }

    // If user manually edits coverImage URL field, update preview too
    if (name === 'coverImage') {
      setCoverPreview(value);
    }

    setForm((prev) => ({
      ...prev,
      [name]: name === 'price' ? Number(value || 0) : value,
    }));
  };

  // Handle image file selected from system
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    // Only allow image types
    if (!file.type.startsWith('image/')) {
      const message = 'Please select a valid image file (JPG, PNG, WebP)';
      setError(message);
      notify.warning('Invalid Image', message);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const message = 'Image is too large. Maximum allowed size is 5MB.';
      setError(message);
      notify.warning('Image Too Large', message);
      return;
    }

    // Read as base64 for preview and form value
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setCoverPreview(base64);
      setImgError(false);
      setForm((prev) => ({ ...prev, coverImage: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // Handle PDF file selected from system
  const handlePdfFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    // Only allow PDF
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      const message = 'Please select a valid PDF file';
      setError(message);
      notify.warning('Invalid PDF', message);
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      const message = 'PDF is too large. Maximum allowed size is 20MB.';
      setError(message);
      notify.warning('PDF Too Large', message);
      return;
    }

    // Read as base64 or object URL for storage
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setPdfName(file.name);
      setForm((prev) => ({ ...prev, pdfUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.author.trim() || !form.category.trim() || !form.pdfUrl.trim()) {
      const message = 'Title, author, category and PDF are required';
      setError(message);
      notify.warning('Missing Fields', message);
      return;
    }

    setSubmitting(true);
    const payload = {
      ...form,
      title:       form.title.trim(),
      author:      form.author.trim(),
      category:    form.category.trim(),
      description: form.description.trim(),
      pdfUrl:      form.pdfUrl.trim(),
      coverImage:  form.coverImage.trim(),
      price:       form.isPaid ? Number(form.price) || 0 : 0,
    };

    try {
      if (isEditing) {
        const { data } = await editBook(editingId, payload);
        setBooks((prev) => prev.map((b) => (b._id === editingId ? data : b)));
        notify.success('Book Updated', 'Book changes were saved successfully.');
      } else {
        const { data } = await addBook(payload);
        setBooks((prev) => [data, ...prev]);
        notify.success('Book Added', 'New book was added successfully.');
      }
      resetForm();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save book';
      setError(message);
      notify.error('Save Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (book) => {
    setEditingId(book._id);
    setImgError(false);
    setCoverPreview(book.coverImage || '');
    setPdfName(book.pdfUrl ? 'Existing PDF loaded' : '');
    setForm({
      title:       book.title       || '',
      author:      book.author      || '',
      category:    book.category    || '',
      description: book.description || '',
      pdfUrl:      book.pdfUrl      || '',
      coverImage:  book.coverImage  || '',
      isPaid:      Boolean(book.isPaid),
      price:       Number(book.price) || 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    setError('');
    try {
      await deleteBook(id);
      setBooks((prev) => prev.filter((b) => b._id !== id));
      if (editingId === id) resetForm();
      notify.success('Book Deleted', 'Book was deleted successfully.');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete book';
      setError(message);
      notify.error('Delete Error', message);
    }
  };

  return (
    <div className="h-screen bg-[#f5f6fa] flex overflow-hidden">
      <AdminNavbar />

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handlePdfFile}
      />

      <main className="flex-1 p-6 md:p-10 overflow-y-scroll">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">📚 Book Management</h1>
            <p className="text-sm text-slate-400 mt-1">
              {books.length} book{books.length !== 1 ? 's' : ''} in library
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#1a1a2e] mb-5">
              {isEditing ? '✏️ Edit Book' : '➕ Add New Book'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="flex flex-col lg:flex-row gap-6">

                {/* Cover Image Preview + Upload */}
                <div className="flex flex-col items-center gap-3 lg:w-48 shrink-0">

                  {/* Preview Box */}
                  <div className="w-40 h-56 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                    {coverPreview && !imgError ? (
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="text-center px-3">
                        <p className="text-4xl mb-1">📖</p>
                        <p className="text-xs text-slate-400">
                          {imgError ? 'Invalid image' : 'No cover yet'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Upload Image Button */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-40 flex items-center justify-center gap-2 border border-slate-200 hover:border-[#1a1a2e] hover:bg-slate-50 text-slate-600 text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    🖼️ Choose Image
                  </button>

                  {/* OR: paste URL */}
                  <div className="w-40">
                    <input
                      name="coverImage"
                      placeholder="Or paste image URL"
                      value={form.coverImage.startsWith('data:') ? '' : form.coverImage}
                      onChange={onChange}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#1a1a2e] transition-colors"
                    />
                  </div>

                  <p className="text-xs text-slate-400 text-center leading-4">
                    Upload from device or paste a URL
                  </p>
                </div>

                {/* Form Fields */}
                <div className="flex-1 grid gap-3 sm:grid-cols-2">

                  <input
                    name="title"
                    placeholder="Book Title *"
                    value={form.title}
                    onChange={onChange}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors"
                  />
                  <input
                    name="author"
                    placeholder="Author *"
                    value={form.author}
                    onChange={onChange}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors"
                  />
                  <input
                    name="category"
                    placeholder="Category *"
                    value={form.category}
                    onChange={onChange}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors"
                  />

                  {/* PDF Upload Field */}
                  <div
                    onClick={() => pdfInputRef.current?.click()}
                    className="border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer hover:border-[#1a1a2e] hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-base">📄</span>
                    <span className={`text-sm truncate ${pdfName ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
                      {pdfName || 'Choose PDF file *'}
                    </span>
                    {pdfName && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setPdfName('');
                          setForm((prev) => ({ ...prev, pdfUrl: '' }));
                          if (pdfInputRef.current) pdfInputRef.current.value = '';
                        }}
                        className="ml-auto text-slate-400 hover:text-red-500 text-xs cursor-pointer"
                      >
                        ✕
                      </span>
                    )}
                  </div>

                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Description"
                    value={form.description}
                    onChange={onChange}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors sm:col-span-2 resize-none"
                  />

                  {/* Paid toggle + price */}
                  <div className="flex items-center gap-4 sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isPaid"
                        checked={form.isPaid}
                        onChange={onChange}
                        className="w-4 h-4 accent-[#1a1a2e]"
                      />
                      Paid Book
                    </label>
                    {form.isPaid && (
                      <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-3 py-2 w-36">
                        <span className="text-sm text-slate-400">₹</span>
                        <input
                          type="number"
                          name="price"
                          min="0"
                          step="0.01"
                          value={form.price}
                          onChange={onChange}
                          className="w-full text-sm outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 sm:col-span-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-[#1a1a2e] hover:bg-[#2a2a4e] disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      {submitting ? 'Saving...' : isEditing ? 'Update Book' : 'Add Book'}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                </div>
              </div>
            </form>
          </div>

          {/* Book Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-[#1a1a2e]">All Books</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Book</th>
                    <th className="px-5 py-3 text-left">Author</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-left">Price</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="border-t border-slate-50">
                        <td className="px-5 py-4" colSpan={5}>
                          <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                        </td>
                      </tr>
                    ))
                  ) : books.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                        <p className="text-3xl mb-2">📭</p>
                        No books found. Add your first book above.
                      </td>
                    </tr>
                  ) : (
                    books.map((book) => (
                      <tr
                        key={book._id}
                        className={`border-t border-slate-50 hover:bg-slate-50 transition-colors ${
                          editingId === book._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        {/* Cover + Title */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-14 rounded-md overflow-hidden bg-slate-100 shrink-0">
                              {book.coverImage ? (
                                <img
                                  src={book.coverImage}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">📖</div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-[#1a1a2e] line-clamp-1 max-w-[180px]">
                                {book.title}
                              </p>
                              {/* PDF indicator */}
                              {book.pdfUrl && (
                                <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  📄 PDF attached
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{book.author}</td>
                        <td className="px-5 py-3">
                          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
                            {book.category}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {book.isPaid ? (
                            <span className="text-green-600 font-medium">
                              ₹{Number(book.price || 0).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-400">Free</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(book)}
                              className="bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(book._id)}
                              className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminBook;
