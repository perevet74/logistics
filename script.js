// --- Feather Icons ---
feather.replace();

// --- FLOATING MENU SCRIPT ---
const fabButton = document.getElementById('fab-menu-button');
const fabMenuItemsContainer = document.getElementById('fab-menu-items');
if (fabButton && fabMenuItemsContainer) {
    fabButton.addEventListener('click', () => {
        const isActive = fabButton.classList.toggle('active');
        if (isActive) {
            fabMenuItemsContainer.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
            } else {
            fabMenuItemsContainer.classList.add('opacity-0', 'scale-90');
            setTimeout(() => {
                fabMenuItemsContainer.classList.add('pointer-events-none');
            }, 300);
        }
    });
}

// --- ANIMATED COUNTERS ---
function animateCounter(element, target, suffix, decimals = 0, duration = 7000) {
    const startValue = 0;
    const startTime = performance.now();
    let animationFrameId;

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation (ease-out cubic)
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (target - startValue) * easeOutCubic;

        // Format the number based on type and decimals
        let displayValue;
        if (suffix === 'M+') {
            displayValue = currentValue.toFixed(decimals);
        } else if (suffix === 'k+') {
            displayValue = Math.round(currentValue).toString();
        } else if (suffix === '%') {
            displayValue = currentValue.toFixed(decimals);
        } else {
            displayValue = Math.round(currentValue).toString();
        }

        element.textContent = displayValue + suffix;

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(updateCounter);
        } else {
            // Ensure final value is exactly the target
            element.textContent = target.toFixed(decimals) + suffix;
        }
    }

    animationFrameId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animationFrameId);
}

// Intersection Observer for stats section
let statsAnimated = false;
const statsSection = document.getElementById('stats-section');

if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !statsAnimated) {
                statsAnimated = true;
                
                const counters = document.querySelectorAll('.counter');
                counters.forEach((counter) => {
                    const target = parseFloat(counter.getAttribute('data-target'));
                    const suffix = counter.getAttribute('data-suffix') || '';
                    const decimals = parseInt(counter.getAttribute('data-decimals')) || 0;
                    
                    animateCounter(counter, target, suffix, decimals, 7000);
                });
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: '0px'
    });

    statsObserver.observe(statsSection);
}

// --- ADMIN DASHBOARD LOGIC ---
(function () {
    const STORAGE_KEY = 'jp_shipments';
    const PAGE_SIZE = 10;

    function readStore() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function writeStore(shipments) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
    }

    function generateId() {
        return 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    function generateTrackingNumber() {
        const prefix = 'JP';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}${timestamp}${random}`.toUpperCase();
    }

    function getTrackingLink(trackingNo) {
        const baseUrl = window.location.origin || 'https://jpeglogistics.cc';
        return `${baseUrl}/tracking.html?tn=${encodeURIComponent(trackingNo)}`;
    }

    function sendStatusEmail(senderEmail, receiverEmail, trackingNo, status, location, statusDate, statusTime, remarks, isNew) {
        const trackingLink = getTrackingLink(trackingNo);
        const dateTime = new Date(`${statusDate} ${statusTime}`).toLocaleString();
        
        const subject = isNew 
            ? `Your JP Logistics shipment has been created: ${trackingNo}`
            : `Shipment Status Update - ${trackingNo}`;
        
        const body = isNew
            ? `Dear Customer,%0D%0A%0D%0AYour shipment has been created with the following details:%0D%0A%0D%0ATracking Number: ${trackingNo}%0D%0AStatus: ${status}%0D%0ADate & Time: ${dateTime}%0D%0ALocation: ${location || 'N/A'}%0D%0A%0D%0ATrack your shipment: ${trackingLink}%0D%0A%0D%0A${remarks ? 'Remarks: ' + remarks + '%0D%0A%0D%0A' : ''}Best regards,%0D%0AJP Logistics Team`
            : `Dear Customer,%0D%0A%0D%0AYour shipment status has been updated:%0D%0A%0D%0ATracking Number: ${trackingNo}%0D%0ACurrent Status: ${status}%0D%0ADate & Time: ${dateTime}%0D%0ALocation: ${location || 'N/A'}%0D%0A%0D%0ATrack your shipment: ${trackingLink}%0D%0A%0D%0A${remarks ? 'Remarks: ' + remarks + '%0D%0A%0D%0A' : ''}Best regards,%0D%0AJP Logistics Team`;

        setTimeout(() => {
            window.open(`mailto:${encodeURIComponent(senderEmail)}?subject=${encodeURIComponent(subject)}&body=${body}`);
            setTimeout(() => {
                window.open(`mailto:${encodeURIComponent(receiverEmail)}?subject=${encodeURIComponent(subject)}&body=${body}`);
            }, 300);
        }, 100);
    }

    function formatDate(ts) {
        const d = new Date(ts);
        return d.toLocaleString();
    }

    function renderTable(state) {
        const tbody = document.getElementById('shipments-tbody');
        const summary = document.getElementById('table-summary');
        if (!tbody || !summary) return;

        const all = readStore();

        const q = (state.search || '').trim().toLowerCase();
        const statusFilter = state.status || '';
        let filtered = all.filter(s => {
            const hay = `${s.trackingNo} ${s.sender.name} ${s.receiver.name} ${s.status} ${s.origin} ${s.destination}`.toLowerCase();
            const matchesQuery = q ? hay.includes(q) : true;
            const matchesStatus = statusFilter ? s.status === statusFilter : true;
            return matchesQuery && matchesStatus;
        });

        const [sortKey, sortDir] = (state.sort || 'updatedAt:desc').split(':');
        filtered.sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (av === bv) return 0;
            if (sortDir === 'asc') return av > bv ? 1 : -1;
            return av < bv ? 1 : -1;
        });

        const total = filtered.length;
        const start = state.page * PAGE_SIZE;
        const pageItems = filtered.slice(start, start + PAGE_SIZE);

        tbody.innerHTML = pageItems.map(s => `
            <tr class="hover:bg-gray-800/60">
                <td class="px-6 py-3 whitespace-nowrap text-sm">${s.trackingNo}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm">${s.sender.name}<br><span class='text-xs text-text-secondary'>${s.sender.email}</span></td>
                <td class="px-6 py-3 whitespace-nowrap text-sm">${s.origin}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm">${s.destination}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm">${s.status}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm">${formatDate(s.updatedAt)}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-right">
                    <button data-action="edit" data-id="${s.id}" class="inline-flex items-center gap-1 text-indigo-300 hover:text-white mr-3">
                        <i data-feather="edit-2" class="h-4 w-4"></i><span>Edit</span>
                    </button>
                    <button data-action="delete" data-id="${s.id}" class="inline-flex items-center gap-1 text-red-300 hover:text-white">
                        <i data-feather="trash-2" class="h-4 w-4"></i><span>Delete</span>
                    </button>
                </td>
            </tr>
        `).join('');

        summary.textContent = `${total} result${total === 1 ? '' : 's'}${total > PAGE_SIZE ? ` • showing ${start + 1}-${Math.min(start + PAGE_SIZE, total)}` : ''}`;
        feather.replace();

        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (prevBtn && nextBtn) {
            prevBtn.disabled = state.page <= 0;
            nextBtn.disabled = start + PAGE_SIZE >= total;
        }
    }

    function openModal(editShipment) {
        const modal = document.getElementById('shipment-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('shipment-form');
        const submitBtn = document.getElementById('submit-btn');
        if (!modal || !title || !form) return;

        const isEdit = !!editShipment;
        title.textContent = isEdit ? 'Edit Shipment' : 'Add Shipment';
        submitBtn.textContent = isEdit ? 'Update Shipment' : 'Add Shipment';
        
        document.getElementById('shipment-id').value = editShipment ? editShipment.id : '';
        
        // Auto-generate tracking number for new shipments
        if (!isEdit) {
            document.getElementById('tracking-no').value = generateTrackingNumber();
        } else {
            document.getElementById('tracking-no').value = editShipment.trackingNo || '';
        }
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        document.getElementById('status-date').value = editShipment ? (editShipment.statusDate || today) : today;
        document.getElementById('status-time').value = editShipment ? (editShipment.statusTime || currentTime) : currentTime;
        
        document.getElementById('status').value = editShipment ? editShipment.status : 'Pending';
        document.getElementById('cargo-type').value = editShipment ? (editShipment.cargoType || '') : '';
        document.getElementById('location').value = editShipment ? (editShipment.location || '') : '';
        document.getElementById('carrier-ref').value = editShipment ? (editShipment.carrierRef || '') : '';
        
        // Handle departure date and time separately
        if (editShipment && editShipment.departureDate) {
            document.getElementById('departure-date').value = editShipment.departureDate;
        } else {
            document.getElementById('departure-date').value = '';
        }
        if (editShipment && editShipment.departureTime) {
            document.getElementById('departure-time').value = editShipment.departureTime;
        } else {
            document.getElementById('departure-time').value = '';
        }
        
        document.getElementById('comments').value = editShipment ? (editShipment.comments || '') : '';
        
        // Reset image preview
        const imagePreview = document.getElementById('image-preview');
        const imagePreviewImg = document.getElementById('image-preview-img');
        if (imagePreview) imagePreview.classList.add('hidden');
        if (imagePreviewImg) imagePreviewImg.src = '';

        // Sender
        document.getElementById('sender-name').value = editShipment ? editShipment.sender.name : '';
        document.getElementById('sender-email').value = editShipment ? editShipment.sender.email : '';
        document.getElementById('sender-phone').value = editShipment ? editShipment.sender.phone : '';
        document.getElementById('sender-city').value = editShipment ? editShipment.sender.city : '';
        document.getElementById('sender-state').value = editShipment ? editShipment.sender.state : '';
        document.getElementById('sender-country').value = editShipment ? editShipment.sender.country : '';
        // Receiver
        document.getElementById('receiver-name').value = editShipment ? editShipment.receiver.name : '';
        document.getElementById('receiver-email').value = editShipment ? editShipment.receiver.email : '';
        document.getElementById('receiver-phone').value = editShipment ? editShipment.receiver.phone : '';
        document.getElementById('receiver-street').value = editShipment ? editShipment.receiver.street : '';
        document.getElementById('receiver-city').value = editShipment ? editShipment.receiver.city : '';
        document.getElementById('receiver-state').value = editShipment ? editShipment.receiver.state : '';
        document.getElementById('receiver-country').value = editShipment ? editShipment.receiver.country : '';
        document.getElementById('receiver-postal').value = editShipment ? editShipment.receiver.postal : '';

        document.getElementById('origin').value = editShipment ? editShipment.origin : '';
        document.getElementById('destination').value = editShipment ? editShipment.destination : '';
        document.getElementById('notes').value = editShipment ? (editShipment.notes || '') : '';
        
        // Show existing featured image if editing and image exists
        if (editShipment && editShipment.featuredImage && editShipment.featuredImage !== 'uploaded') {
            const imagePreview = document.getElementById('image-preview');
            const imagePreviewImg = document.getElementById('image-preview-img');
            if (imagePreview && imagePreviewImg) {
                imagePreviewImg.src = editShipment.featuredImage;
                imagePreview.classList.remove('hidden');
            }
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        // ensure page can scroll the modal content
        try { document.documentElement.style.overflow = 'hidden'; } catch(_) {}
    }

    function closeModal() {
        const modal = document.getElementById('shipment-modal');
        const form = document.getElementById('shipment-form');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if (form) form.reset();
        // Reset image preview
        const imagePreview = document.getElementById('image-preview');
        const imagePreviewImg = document.getElementById('image-preview-img');
        if (imagePreview) imagePreview.classList.add('hidden');
        if (imagePreviewImg) imagePreviewImg.src = '';
        try { document.documentElement.style.overflow = ''; } catch(_) {}
    }

    function upsertFromForm() {
        // Handle image upload first if present
        const imageInput = document.getElementById('featured-image');
        const hasImage = imageInput && imageInput.files && imageInput.files[0];
        
        if (hasImage) {
            const reader = new FileReader();
            reader.onload = function(e) {
                proceedWithSave(e.target.result);
            };
            reader.onerror = function() {
                alert('Error reading image file');
            };
            reader.readAsDataURL(imageInput.files[0]);
            return; // Exit, will continue after image is read
        }
        
        proceedWithSave(null);
        
        function proceedWithSave(imageBase64) {
            function get(id) { return document.getElementById(id).value.trim(); }
            const id = get('shipment-id');
            let trackingNo = get('tracking-no');
            const status = get('status');
            const cargoType = get('cargo-type');
            const statusDate = get('status-date');
            const statusTime = get('status-time');
            const location = get('location');
            const carrierRef = get('carrier-ref');
            const departureDate = get('departure-date');
            const departureTime = get('departure-time');
            const comments = get('comments');
            
            // Sender/Shipper
            const sender = {
                name: get('sender-name'),
                email: get('sender-email'),
                phone: get('sender-phone'),
                city: get('sender-city'),
                state: get('sender-state'),
                country: get('sender-country')
            };
            // Receiver
            const receiver = {
                name: get('receiver-name'),
                email: get('receiver-email'),
                phone: get('receiver-phone'),
                street: get('receiver-street'),
                city: get('receiver-city'),
                state: get('receiver-state'),
                country: get('receiver-country'),
                postal: get('receiver-postal')
            };
            // Other
            const origin = get('origin');
            const destination = get('destination');
            const notes = get('notes');

            // Validate required fields
            for (const obj of [sender, receiver]) {
                for (const key in obj) {
                    if (!obj[key]) {
                        alert('All sender and receiver fields are required.');
                        return;
                    }
                }
            }
            if (!status || !cargoType || !statusDate || !statusTime || !location || !origin || !destination) {
                alert('Please fill all required fields.');
                return;
            }

            const store = readStore();
            const now = Date.now();
            let isNew = false;
            let oldStatus = null;
            
            // Auto-generate tracking number if new
            if (!id && !trackingNo) {
                trackingNo = generateTrackingNumber();
                document.getElementById('tracking-no').value = trackingNo;
            }
            
            const featuredImage = imageBase64;
            
            if (id) {
                const idx = store.findIndex(s => s.id === id);
                if (idx >= 0) {
                    oldStatus = store[idx].status;
                    const existingImage = store[idx].featuredImage;
                    store[idx] = { 
                        ...store[idx], 
                        trackingNo, 
                        sender, 
                        receiver, 
                        status, 
                        cargoType,
                        statusDate,
                        statusTime,
                        location,
                        carrierRef,
                        departureDate,
                        departureTime,
                        comments,
                        origin, 
                        destination, 
                        notes,
                        featuredImage: featuredImage || existingImage || null,
                        updatedAt: now 
                    };
                }
            } else {
                isNew = true;
                store.unshift({ 
                    id: generateId(), 
                    trackingNo, 
                    sender, 
                    receiver, 
                    status, 
                    cargoType,
                    statusDate,
                    statusTime,
                    location,
                    carrierRef,
                    departureDate,
                    departureTime,
                    comments,
                    origin, 
                    destination, 
                    notes,
                    featuredImage: featuredImage || null,
                    createdAt: now, 
                    updatedAt: now 
                });
            }
            writeStore(store);

            // Close modal and refresh table after save
            closeModal();
            
            // Get current state from UI to preserve filters
            const searchInput = document.getElementById('search-input');
            const statusFilter = document.getElementById('status-filter');
            const sortSelect = document.getElementById('sort-select');
            const currentState = {
                search: searchInput ? searchInput.value : '',
                status: statusFilter ? statusFilter.value : '',
                sort: sortSelect ? sortSelect.value : 'updatedAt:desc',
                page: 0
            };
            renderTable(currentState);
            
            // Send emails on creation or status change
            const statusChanged = isNew || (oldStatus && oldStatus !== status);
            if (statusChanged || isNew) {
                const remarks = comments || notes || '';
                sendStatusEmail(
                    sender.email, 
                    receiver.email, 
                    trackingNo, 
                    status, 
                    location, 
                    statusDate, 
                    statusTime, 
                    remarks, 
                    isNew
                );
                setTimeout(() => {
                    alert(isNew 
                        ? 'Shipment created! Email notifications sent to shipper and receiver.' 
                        : 'Status updated! Email notifications sent to shipper and receiver.');
                }, 1000);
            } else {
                // Still show success message even if status didn't change
                setTimeout(() => {
                    alert('Shipment updated successfully!');
                }, 100);
            }
        } // End proceedWithSave
    }

    function exportJSON() {
        const data = readStore();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shipments-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importJSON(file, onDone) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const arr = JSON.parse(reader.result);
                if (Array.isArray(arr)) {
                    writeStore(arr);
                    onDone(true);
                } else {
                    onDone(false);
                }
            } catch (e) {
                onDone(false);
            }
        };
        reader.readAsText(file);
    }

    function seedIfEmpty() {
        const current = readStore();
        if (current.length === 0) {
            const now = Date.now();
            writeStore([
                {
                    id: generateId(),
                    trackingNo: 'JP123456789',
                    sender: {
                        name: 'Ana Becker', email: 'ana@example.com', phone: '+493012345', street: 'Alexanderstr 1', city: 'Berlin', state: 'BE', country: 'DE', postal: '10117'
                    },
                    receiver: {
                        name: 'Jeff Miller', email: 'jeff@example.com', phone: '+197212345', street: 'Main St 101', city: 'Dallas', state: 'TX', country: 'US', postal: '75201'
                    },
                    status: 'In Transit',
                    origin: 'Berlin, DE',
                    destination: 'Dallas, US',
                    notes: 'Left hub - Frankfurt',
                    createdAt: now - 86400000,
                    updatedAt: now - 3600000
                },
                {
                    id: generateId(),
                    trackingNo: 'JP987654321',
                    sender: {
                        name: 'Sophie Laurent', email: 'sophie@example.com', phone: '+331234567', street: 'Rue Rivoli 5', city: 'Paris', state: 'IDF', country: 'FR', postal: '75001'
                    },
                    receiver: {
                        name: 'Brittany Jones', email: 'britt@example.com', phone: '+183212345', street: 'Park Rd 78', city: 'Houston', state: 'TX', country: 'US', postal: '77001'
                    },
                    status: 'Pending',
                    origin: 'Paris, FR',
                    destination: 'Houston, US',
                    notes: '',
                    createdAt: now - 172800000,
                    updatedAt: now - 7200000
                }
            ]);
        }
    }

    function bindEvents(state) {
        const addBtn = document.getElementById('btn-add');
        const expBtn = document.getElementById('btn-export');
        const impInput = document.getElementById('import-input');
        const searchInput = document.getElementById('search-input');
        const statusFilter = document.getElementById('status-filter');
        const sortSelect = document.getElementById('sort-select');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const tbody = document.getElementById('shipments-tbody');

        if (addBtn) addBtn.addEventListener('click', () => openModal(null));
        if (expBtn) expBtn.addEventListener('click', exportJSON);
        if (impInput) impInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) importJSON(file, (ok) => { if (ok) { state.page = 0; renderTable(state); } });
            e.target.value = '';
        });

        if (searchInput) searchInput.addEventListener('input', (e) => { state.search = e.target.value; state.page = 0; renderTable(state); });
        if (statusFilter) statusFilter.addEventListener('change', (e) => { state.status = e.target.value; state.page = 0; renderTable(state); });
        if (sortSelect) sortSelect.addEventListener('change', (e) => { state.sort = e.target.value; state.page = 0; renderTable(state); });
        if (prevBtn) prevBtn.addEventListener('click', () => { if (state.page > 0) { state.page -= 1; renderTable(state); } });
        if (nextBtn) nextBtn.addEventListener('click', () => { state.page += 1; renderTable(state); });

        if (tbody) tbody.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const action = target.getAttribute('data-action');
            const id = target.getAttribute('data-id');
            if (!action || !id) return;
            const store = readStore();
            const shipment = store.find(s => s.id === id);
            if (action === 'edit' && shipment) {
                openModal(shipment);
            } else if (action === 'delete') {
                const next = store.filter(s => s.id !== id);
                writeStore(next);
                renderTable(state);
            }
        });

        const modal = document.getElementById('shipment-modal');
        const modalClose = document.getElementById('modal-close');
        const modalCancel = document.getElementById('modal-cancel');
        const form = document.getElementById('shipment-form');
        const imageInput = document.getElementById('featured-image');
        
        if (modalClose) {
            modalClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
            });
        }
        if (modalCancel) {
            modalCancel.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal();
            });
        }
        if (modal) {
            modal.addEventListener('click', (e) => { 
                if (e.target === modal) closeModal(); 
            });
        }
        
        // Image preview handler
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const preview = document.getElementById('image-preview');
                        const previewImg = document.getElementById('image-preview-img');
                        if (preview && previewImg) {
                            previewImg.src = e.target.result;
                            preview.classList.remove('hidden');
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                upsertFromForm();
                // Modal closing and table refresh handled inside upsertFromForm after save
            });
        }
    }

    window.initAdminDashboard = function initAdminDashboard() {
        const isAdminPage = document.getElementById('admin-app');
        if (!isAdminPage) return;
        
        seedIfEmpty();
        const state = { search: '', status: '', sort: 'updatedAt:desc', page: 0 };
        bindEvents(state);
        renderTable(state);
    };
    
    // Also initialize immediately when script loads if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (window.initAdminDashboard) {
                window.initAdminDashboard();
            }
        });
    } else {
        // DOM already loaded
        if (window.initAdminDashboard) {
            setTimeout(() => window.initAdminDashboard(), 50);
        }
    }
    

    // Fallback public opener so inline onclick can trigger modal if binding fails
    window.__forceOpenModal = function () { openModal(null); };

    // Tracking page logic
    function findByTracking(trackingNo) {
        const all = readStore();
        return all.find(s => (s.trackingNo || '').toLowerCase() === trackingNo.toLowerCase());
    }

    function renderTrackingResult(container, shipment, trackingNo) {
        if (!container) return;
        if (!shipment) {
            container.innerHTML = `
                <div class="card rounded-2xl p-6">
                    <div class="flex items-start gap-3">
                        <i data-feather="alert-circle" class="h-6 w-6 text-red-400"></i>
                        <div>
                            <h3 class="text-white font-semibold">No results for "${trackingNo}"</h3>
                            <p class="text-text-secondary text-sm">Please check the tracking number and try again.</p>
                        </div>
                    </div>
                </div>`;
            feather.replace();
            return;
        }

        const lastUpdated = formatDate(shipment.updatedAt);
        const note = shipment.notes ? shipment.notes : '—';
        container.innerHTML = `
            <div class="grid gap-6">
                <div class="card rounded-2xl p-6">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h3 class="text-xl font-bold text-white">Tracking: ${shipment.trackingNo}</h3>
                            <p class="text-text-secondary text-sm">Route: ${shipment.origin} → ${shipment.destination}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="px-3 py-1 rounded-full text-sm bg-indigo-600 text-white">${shipment.status}</span>
                            <span class="text-xs text-text-secondary">Updated: ${lastUpdated}</span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="card rounded-2xl p-6">
                        <h4 class="text-white font-semibold mb-2">Current Note / Location</h4>
                        <p class="text-text-secondary text-sm">${note}</p>
                    </div>
                    <div class="card rounded-2xl p-6">
                        <h4 class="text-white font-semibold mb-2">Receiver</h4>
                        <p class="text-text-secondary text-sm">${shipment.receiver.name}</p>
                        <p class="text-text-secondary text-sm">${shipment.receiver.city}, ${shipment.receiver.state}, ${shipment.receiver.country}</p>
                    </div>
                </div>
            </div>
        `;
        feather.replace();
    }

    function initTrackingPage() {
        const form = document.getElementById('trackForm');
        const input = document.getElementById('trackingNumber');
        const result = document.getElementById('trackingResult');
        if (!form || !input || !result) return;
        seedIfEmpty();

        // Support query param ?tn=...
        const params = new URLSearchParams(window.location.search);
        const tn = params.get('tn');
        if (tn) {
            input.value = tn;
            renderTrackingResult(result, findByTracking(tn), tn);
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const trackingNo = input.value.trim();
            if (!trackingNo) return;
            const match = findByTracking(trackingNo);
            renderTrackingResult(result, match, trackingNo);
        });
    }

    // Auto-init tracking page if present
    document.addEventListener('DOMContentLoaded', initTrackingPage);
})();
