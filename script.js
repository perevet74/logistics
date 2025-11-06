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

    // Notification system
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
        notification.className = `${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between gap-4 animate-slide-in`;
        notification.innerHTML = `
            <span class="flex-1">${message}</span>
            <button class="text-white hover:text-gray-200" onclick="this.parentElement.remove()">
                <i data-feather="x" class="h-4 w-4"></i>
            </button>
        `;
        
        container.appendChild(notification);
        feather.replace();
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                notification.style.transition = 'all 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

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

    async function sendStatusEmail(senderEmail, receiverEmail, trackingNo, status, location, statusDate, statusTime, remarks, isNew) {
        const trackingLink = getTrackingLink(trackingNo);
        const dateTime = new Date(`${statusDate} ${statusTime}`).toLocaleString();
        
        const subject = isNew 
            ? `Your JP Logistics shipment has been created: ${trackingNo}`
            : `Shipment Status Update - ${trackingNo}`;
        
        const emailBody = isNew
            ? `Dear Customer,\n\nYour shipment has been created with the following details:\n\nTracking Number: ${trackingNo}\nStatus: ${status}\nDate & Time: ${dateTime}\nLocation: ${location || 'N/A'}\n\nTrack your shipment: ${trackingLink}\n\n${remarks ? 'Remarks: ' + remarks + '\n\n' : ''}Best regards,\nJP Logistics Team`
            : `Dear Customer,\n\nYour shipment status has been updated:\n\nTracking Number: ${trackingNo}\nCurrent Status: ${status}\nDate & Time: ${dateTime}\nLocation: ${location || 'N/A'}\n\nTrack your shipment: ${trackingLink}\n\n${remarks ? 'Remarks: ' + remarks + '\n\n' : ''}Best regards,\nJP Logistics Team`;

        // Try EmailJS first if configured
        const emailConfig = window.emailJSConfig || {};
        if (emailConfig.serviceId && emailConfig.templateId && emailConfig.publicKey && typeof emailjs !== 'undefined') {
            try {
                // Initialize EmailJS once
                if (!window.__emailjs_inited) {
                    emailjs.init(emailConfig.publicKey);
                    window.__emailjs_inited = true;
                }

                // Preferred: send ONE email to both recipients via dynamic To field
                const combinedRecipients = `${senderEmail}, ${receiverEmail}`;
                const templateParams = {
                    // Common content
                    subject: subject,
                    message: emailBody,
                    tracking_number: trackingNo,
                    tracking_link: trackingLink,
                    from_email: emailConfig.fromEmail || 'info@ssdtechnicianlab.com',
                    from_name: emailConfig.fromName || 'JP Logistics',
                    // Try multiple common variable names used in EmailJS templates
                    to_email: combinedRecipients,
                    to: combinedRecipients,
                    reply_to: emailConfig.fromEmail || 'info@ssdtechnicianlab.com',
                    to_name: 'Customer'
                };

                try {
                    await emailjs.send(emailConfig.serviceId, emailConfig.templateId, templateParams);
                    console.log('Email sent to both recipients:', combinedRecipients);
                    return true;
                } catch (firstErr) {
                    console.warn('Combined send failed, attempting individual sends...', firstErr);
                    // Fallback: send to each recipient individually
                    const senderParams = { ...templateParams, to_email: senderEmail, to: senderEmail, to_name: senderEmail.split('@')[0] };
                    const receiverParams = { ...templateParams, to_email: receiverEmail, to: receiverEmail, to_name: receiverEmail.split('@')[0] };
                    await emailjs.send(emailConfig.serviceId, emailConfig.templateId, senderParams);
                    await emailjs.send(emailConfig.serviceId, emailConfig.templateId, receiverParams);
                    console.log('Emails sent individually to:', senderEmail, 'and', receiverEmail);
                    return true;
                }
            } catch (error) {
                console.error('EmailJS error:', error);
                console.error('EmailJS error details:', {
                    message: error.message,
                    text: error.text,
                    status: error.status
                });
                // Don't fallback to mailto - just return false so we can show notification
                return false;
            }
        } else {
            // EmailJS not configured - log warning
            console.warn('EmailJS not configured. Please set up emailJSConfig in firebase-config.js');
            console.warn('Required: serviceId, templateId, publicKey');
            return false;
        }
    }

    function fallbackToMailto(senderEmail, receiverEmail, subject, body) {
        // Fallback to mailto links if EmailJS not configured
        const mailtoBody = body.replace(/\n/g, '%0D%0A');
        setTimeout(() => {
            window.open(`mailto:${encodeURIComponent(senderEmail)}?subject=${encodeURIComponent(subject)}&body=${mailtoBody}`);
            setTimeout(() => {
                window.open(`mailto:${encodeURIComponent(receiverEmail)}?subject=${encodeURIComponent(subject)}&body=${mailtoBody}`);
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
        const all = (state.runtimeShipments && Array.isArray(state.runtimeShipments)) ? state.runtimeShipments : readStore();

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
                    <button data-action="quick-edit" data-id="${s.id}" class="inline-flex items-center gap-1 text-emerald-300 hover:text-white mr-3">
                        <i data-feather="zap" class="h-4 w-4"></i><span>Quick Edit</span>
                    </button>
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
        // New fields
        const shipmentTitleEl = document.getElementById('shipment-title');
        if (shipmentTitleEl) shipmentTitleEl.value = editShipment ? (editShipment.shipmentTitle || '') : '';
        const cargoNameEl = document.getElementById('cargo-name');
        if (cargoNameEl) cargoNameEl.value = editShipment ? (editShipment.cargoName || '') : '';
        document.getElementById('mode-of-shipment').value = editShipment ? (editShipment.modeOfShipment || '') : '';
        // Cargo weight (optional)
        const cwUnit = document.getElementById('cargo-weight-unit');
        const cwValue = document.getElementById('cargo-weight-value');
        if (cwUnit) cwUnit.value = editShipment && editShipment.cargoWeightUnit ? editShipment.cargoWeightUnit : (cwUnit.value || 'kg');
        if (cwValue) cwValue.value = editShipment && typeof editShipment.cargoWeightValue !== 'undefined' && editShipment.cargoWeightValue !== null ? editShipment.cargoWeightValue : '';
        document.getElementById('payment-method').value = editShipment ? (editShipment.paymentMethod || '') : '';
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

    async function upsertFromForm() {
        // Handle image upload first if present
        const imageInput = document.getElementById('featured-image');
        const hasImage = imageInput && imageInput.files && imageInput.files[0];
        
        if (hasImage) {
            const reader = new FileReader();
            reader.onload = function(e) {
                proceedWithSave(e.target.result);
            };
            reader.onerror = function() {
                showNotification('Error reading image file', 'error');
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
            const shipmentTitle = get('shipment-title');
            const cargoName = get('cargo-name');
            const modeOfShipment = get('mode-of-shipment');
            const paymentMethod = get('payment-method');
            const statusDate = get('status-date');
            const statusTime = get('status-time');
            const location = get('location');
            const carrierRef = get('carrier-ref');
            const departureDate = get('departure-date');
            const departureTime = get('departure-time');
            const comments = get('comments');
            // Cargo weight (optional)
            const cargoWeightUnit = (document.getElementById('cargo-weight-unit') || { value: '' }).value;
            const cargoWeightRaw = (document.getElementById('cargo-weight-value') || { value: '' }).value;
            const cargoWeightValue = cargoWeightRaw ? parseFloat(cargoWeightRaw) : null;
            
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
                        showNotification('All sender and receiver fields are required.', 'error');
                        return;
                    }
                }
            }
            // Validate required fields
            if (!status || !cargoType || !shipmentTitle || !cargoName || !modeOfShipment || !paymentMethod || !statusDate || !statusTime || !location || !origin || !destination) {
                showNotification('Please fill all required fields.', 'error');
                return;
            }
            // If one weight piece provided, require both
            if ((cargoWeightRaw && !cargoWeightUnit) || (!cargoWeightRaw && cargoWeightUnit)) {
                showNotification('Provide both cargo weight and unit, or leave both empty.', 'error');
                return;
            }
            if (cargoWeightValue !== null && (isNaN(cargoWeightValue) || cargoWeightValue < 0)) {
                showNotification('Cargo weight must be a non-negative number.', 'error');
                return;
            }

            const usingFirebase = !!(window.DB && DB.hasFirebaseConfig);
            const store = usingFirebase ? (stateCache.runtimeShipments || []) : readStore();
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
                const existing = store.find(s => s.id === id);
                if (existing) {
                    oldStatus = existing.status;
                }
                if (usingFirebase && window.DB) {
                    console.log('Updating shipment in Firestore:', id);
                    DB.updateShipment(id, {
                        id,
                        trackingNo,
                        sender,
                        receiver,
                        status,
                        cargoType,
                        shipmentTitle,
                        cargoName,
                        modeOfShipment,
                        paymentMethod,
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
                        cargoWeightUnit: cargoWeightValue !== null ? cargoWeightUnit : null,
                        cargoWeightValue: cargoWeightValue !== null ? cargoWeightValue : null,
                        featuredImage: featuredImage || (existing && existing.featuredImage) || null,
                        createdAt: existing ? existing.createdAt : now
                    }).then(() => {
                        console.log('Shipment updated successfully in Firestore');
                    }).catch((err) => {
                        console.error('Failed to update shipment:', err);
                        showNotification('Failed to update shipment: ' + (err.message || 'Unknown error'), 'error');
                    });
                } else {
                const idx = store.findIndex(s => s.id === id);
                if (idx >= 0) {
                    const existingImage = store[idx].featuredImage;
                    store[idx] = { 
                        ...store[idx], 
                        trackingNo, 
                        sender, 
                        receiver, 
                        status, 
                        cargoType,
                            shipmentTitle,
                            cargoName,
                            modeOfShipment,
                            paymentMethod,
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
                            cargoWeightUnit: cargoWeightValue !== null ? cargoWeightUnit : store[idx].cargoWeightUnit || null,
                            cargoWeightValue: cargoWeightValue !== null ? cargoWeightValue : store[idx].cargoWeightValue || null,
                        featuredImage: featuredImage || existingImage || null,
                        updatedAt: now 
                    };
                        writeStore(store);
                    }
                }
            } else {
                isNew = true;
                const newRecord = {
                    id: generateId(), 
                    trackingNo, 
                    sender, 
                    receiver, 
                    status, 
                    cargoType,
                    shipmentTitle,
                    cargoName,
                    modeOfShipment,
                    paymentMethod,
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
                    cargoWeightUnit: cargoWeightValue !== null ? cargoWeightUnit : null,
                    cargoWeightValue: cargoWeightValue !== null ? cargoWeightValue : null,
                    featuredImage: featuredImage || null,
                    createdAt: now, 
                    updatedAt: now 
                };
                if (usingFirebase && window.DB) {
                    console.log('Creating shipment in Firestore:', newRecord.trackingNo);
                    DB.createShipment(newRecord).then(() => {
                        console.log('Shipment created successfully in Firestore');
                    }).catch((err) => {
                        console.error('Failed to create shipment:', err);
                        showNotification('Failed to create shipment: ' + (err.message || 'Unknown error'), 'error');
                    });
                } else {
                    const next = [newRecord, ...store];
                    writeStore(next);
                }
            }

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
                page: 0,
                runtimeShipments: stateCache.runtimeShipments || null
            };
            renderTable(currentState);
            
            // Show success notification (email notices suppressed)
            showNotification(
                isNew ? 'Shipment created successfully!' : 'Shipment updated successfully!',
                'success'
            );

            // Send emails on creation or status change (silent on dashboard)
            const statusChanged = isNew || (oldStatus && oldStatus !== status);
            if (statusChanged || isNew) {
                const remarks = comments || notes || '';
                // Fire and forget; no dashboard notifications
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
                ).catch((err) => console.error('Email sending error:', err));
            }
        } // End proceedWithSave
    }

    function exportJSON() {
        const usingFirebase = !!(window.DB && DB.hasFirebaseConfig);
        const data = usingFirebase && stateCache.runtimeShipments ? stateCache.runtimeShipments : readStore();
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
                    const usingFirebase = !!(window.DB && DB.hasFirebaseConfig);
                    if (usingFirebase) {
                        try {
                            const initRes = DB.init();
                            if (!initRes.ready) {
                    writeStore(arr);
                    onDone(true);
                                return;
                            }
                        } catch (_) {}
                        const ops = arr.map((item) => {
                            const data = { ...item };
                            const id = data.id;
                            delete data.id;
                            if (id) {
                                return DB.updateShipment(id, { ...data, id }).catch(() => {});
                            }
                            return DB.createShipment(data).catch(() => {});
                        });
                        Promise.all(ops).then(() => onDone(true)).catch(() => onDone(false));
                    } else {
                        writeStore(arr);
                        onDone(true);
                    }
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
            const usingFirebase = !!(window.DB && DB.hasFirebaseConfig);
            const store = usingFirebase ? (stateCache.runtimeShipments || []) : readStore();
            const shipment = store.find(s => s.id === id);
            if (action === 'edit' && shipment) {
                openModal(shipment);
            } else if (action === 'quick-edit' && shipment) {
                openQuickEditModal(shipment);
            } else if (action === 'delete') {
                if (usingFirebase && window.DB) {
                    DB.deleteShipment(id).then(() => {
                        showNotification('Shipment deleted successfully!', 'success');
                    }).catch(() => { 
                        showNotification('Failed to delete shipment.', 'error'); 
                    });
                } else {
                const next = store.filter(s => s.id !== id);
                writeStore(next);
                renderTable(state);
                    showNotification('Shipment deleted successfully!', 'success');
                }
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

        // Quick edit modal bindings
        const qModal = document.getElementById('quick-edit-modal');
        const qClose = document.getElementById('quick-modal-close');
        const qCancel = document.getElementById('quick-modal-cancel');
        const qForm = document.getElementById('quick-edit-form');
        if (qClose) qClose.addEventListener('click', (e) => { e.preventDefault(); closeQuickEditModal(); });
        if (qCancel) qCancel.addEventListener('click', (e) => { e.preventDefault(); closeQuickEditModal(); });
        if (qModal) qModal.addEventListener('click', (e) => { if (e.target === qModal) closeQuickEditModal(); });
        if (qForm) {
            qForm.addEventListener('submit', (e) => {
                e.preventDefault();
                upsertQuickEdit();
            });
        }
    }

    const stateCache = { runtimeShipments: null };

    window.initAdminDashboard = function initAdminDashboard() {
        const isAdminPage = document.getElementById('admin-app');
        if (!isAdminPage) return;
        
        const useFirebase = !!(window.DB && DB.hasFirebaseConfig);
        const state = { search: '', status: '', sort: 'updatedAt:desc', page: 0, runtimeShipments: null };
        bindEvents(state);

        // Sign out when leaving the admin page (closing tab, navigating away, or refreshing)
        // This ensures login is required every time admin accesses the page
        if (useFirebase && window.DB) {
            window.addEventListener('beforeunload', () => {
                if (window.DB && window.DB.signOut) {
                    window.DB.signOut().catch(() => {});
                }
            });
            
            // Also sign out on page visibility change (tab switch) for extra security
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && window.DB && window.DB.signOut) {
                    // Optional: sign out when tab becomes hidden
                    // Uncomment the line below if you want to sign out even when switching tabs
                    // window.DB.signOut().catch(() => {});
                }
            });
        }

        // Auth gate
        const authGate = document.getElementById('auth-gate');
        const authForm = document.getElementById('auth-form');
        const authError = document.getElementById('auth-error');
        const statusEl = document.getElementById('realtime-status');
        
        // Ensure auth gate is visible initially
        if (authGate) {
            authGate.classList.remove('hidden');
        }
        
        if (useFirebase && window.DB) {
            const initRes = DB.init();
            if (!initRes.ready) {
                // Fallback to local storage - show auth gate
                if (statusEl) statusEl.textContent = 'Status: local mode (not connected)';
                if (authGate) authGate.classList.remove('hidden');
                seedIfEmpty();
        renderTable(state);
                return;
            }
            if (statusEl) statusEl.textContent = 'Status: connected (awaiting sign-in)';
            DB.onAuth(async (user) => {
                const allowed = DB.isAllowedUser(user);
                if (!user || !allowed) {
                    if (authGate) {
                        authGate.classList.remove('hidden');
                    }
                    if (statusEl) statusEl.textContent = 'Status: connected (sign-in required)';
                } else {
                    if (authGate) {
                        authGate.classList.add('hidden');
                    }
                    if (statusEl) statusEl.textContent = 'Status: connected (realtime)';
                }
                if (user && allowed) {
                    // Subscribe to realtime shipments
                    if (stateCache.unsubscribe) stateCache.unsubscribe();
                    console.log('Setting up real-time listener for shipments...');
                    stateCache.unsubscribe = DB.onShipmentsSnapshot((arr) => {
                        console.log('Received shipments from Firestore:', arr.length);
                        stateCache.runtimeShipments = arr;
                        const next = { ...state, runtimeShipments: arr };
                        renderTable(next);
                    });
                } else {
                    // No access -> clear
                    stateCache.runtimeShipments = null;
                    renderTable(state);
                }
            });
            if (authForm) {
                authForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('auth-email').value.trim();
                    const pass = document.getElementById('auth-password').value;
                    try {
                        if (authError) authError.classList.add('hidden');
                        await DB.signIn(email, pass);
                    } catch (err) {
                        if (authError) {
                            authError.textContent = err.message || 'Sign-in failed';
                            authError.classList.remove('hidden');
                        }
                        if (statusEl) statusEl.textContent = 'Status: connected (sign-in error)';
                    }
                });
            }
        } else {
            // Local-only fallback - skip auth for local development
            if (statusEl) statusEl.textContent = 'Status: local mode (no Firebase config)';
            if (authGate) {
                authGate.classList.add('hidden');
            }
            seedIfEmpty();
            renderTable(state);
        }
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

    function openQuickEditModal(shipment) {
        const modal = document.getElementById('quick-edit-modal');
        if (!modal) return;
        document.getElementById('quick-shipment-id').value = shipment.id;
        document.getElementById('quick-status').value = shipment.status || 'Pending';
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        document.getElementById('quick-status-date').value = shipment.statusDate || today;
        document.getElementById('quick-status-time').value = shipment.statusTime || currentTime;
        document.getElementById('quick-location').value = shipment.location || '';
        document.getElementById('quick-notes').value = shipment.notes || '';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        try { document.documentElement.style.overflow = 'hidden'; } catch(_) {}
    }

    function closeQuickEditModal() {
        const modal = document.getElementById('quick-edit-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        try { document.documentElement.style.overflow = ''; } catch(_) {}
    }

    function upsertQuickEdit() {
        function get(id) { return document.getElementById(id).value.trim(); }
        const id = get('quick-shipment-id');
        const status = get('quick-status');
        const statusDate = get('quick-status-date');
        const statusTime = get('quick-status-time');
        const location = get('quick-location');
        const notes = get('quick-notes');
        if (!id || !status || !statusDate || !statusTime || !location) {
            showNotification('Please fill required fields for quick edit.', 'error');
            return;
        }
        const usingFirebase = !!(window.DB && DB.hasFirebaseConfig);
        const store = usingFirebase ? (stateCache.runtimeShipments || []) : readStore();
        const existing = store.find(s => s.id === id);
        if (!existing) { showNotification('Shipment not found.', 'error'); return; }
        const now = Date.now();
        const oldStatus = existing.status;

        if (usingFirebase && window.DB) {
            DB.updateShipment(id, {
                ...existing,
                id,
                status,
                statusDate,
                statusTime,
                location,
                notes,
                updatedAt: now
            }).then(() => {
                // Success notification for quick edit
                showNotification('Shipment updated successfully!', 'success');
            }).catch((err) => {
                console.error('Quick update error:', err);
                showNotification('Failed to update shipment: ' + (err.message || 'Unknown error'), 'error');
            });
        } else {
            const idx = store.findIndex(s => s.id === id);
            if (idx >= 0) {
                store[idx] = { ...store[idx], status, statusDate, statusTime, location, notes, updatedAt: now };
                writeStore(store);
            }
        }

        // Close and refresh
        closeQuickEditModal();
        const searchInput = document.getElementById('search-input');
        const statusFilter = document.getElementById('status-filter');
        const sortSelect = document.getElementById('sort-select');
        const currentState = {
            search: searchInput ? searchInput.value : '',
            status: statusFilter ? statusFilter.value : '',
            sort: sortSelect ? sortSelect.value : 'updatedAt:desc',
            page: 0,
            runtimeShipments: stateCache.runtimeShipments || null
        };
        renderTable(currentState);

        // Success notification for quick edit (local or Firebase)
        showNotification('Shipment updated successfully!', 'success');

        // Send email if status changed (silent)
        const statusChanged = oldStatus && oldStatus !== status;
        if (statusChanged) {
            const sender = existing.sender || {};
            const receiver = existing.receiver || {};
            sendStatusEmail(
                sender.email || '',
                receiver.email || '',
                existing.trackingNo || '',
                status,
                location,
                statusDate,
                statusTime,
                notes || '',
                false
            ).catch(() => {});
        }
    }

    // Tracking page logic
    async function findByTracking(trackingNo) {
        const useFirebase = !!(window.DB && DB.hasFirebaseConfig);
        if (useFirebase && window.DB) {
            try {
                const initRes = DB.init();
                if (initRes.ready) {
                    const doc = await DB.findShipmentByTracking(trackingNo);
                    return doc;
                } else {
                    console.warn('Firebase not ready, falling back to local storage');
                }
            } catch (err) {
                console.error('Firebase error in findByTracking:', err);
            }
        }
        // Fallback to local storage
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

        const lastUpdated = shipment.updatedAt ? formatDate(shipment.updatedAt) : '—';
        const note = shipment.notes ? shipment.notes : '—';
        const statusDate = shipment.statusDate || '—';
        const statusTime = shipment.statusTime || '—';
        const location = shipment.location || '—';
        const cargoType = shipment.cargoType || '—';
        const carrierRef = shipment.carrierRef || '—';
        const departureDate = shipment.departureDate || '—';
        const departureTime = shipment.departureTime || '—';
        const comments = shipment.comments || '—';
        const featuredImage = shipment.featuredImage || '';
        const sender = shipment.sender || {};
        const receiver = shipment.receiver || {};
        const senderStreet = sender.street || '—';
        const receiverStreet = receiver.street || '—';
        const senderPostal = sender.postal || '—';
        const receiverPostal = receiver.postal || '—';

        container.innerHTML = `
            <div class="grid gap-6">
                <div class="card rounded-2xl p-6">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h3 class="text-xl font-bold text-white">Tracking: ${shipment.trackingNo || '—'}</h3>
                            <p class="text-text-secondary text-sm">Route: ${shipment.origin || '—'} → ${shipment.destination || '—'}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="px-3 py-1 rounded-full text-sm bg-indigo-600 text-white">${shipment.status || '—'}</span>
                            <span class="text-xs text-text-secondary">Updated: ${lastUpdated}</span>
                        </div>
                    </div>
                </div>

                ${featuredImage ? `
                <div class="card rounded-2xl p-0 overflow-hidden">
                    <img src="${featuredImage}" alt="Shipment" class="w-full max-h-96 object-cover" />
                </div>
                ` : ''}

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="card rounded-2xl p-6">
                        <h4 class="text-white font-semibold mb-3">Current Status</h4>
                        <dl class="grid grid-cols-1 gap-2 text-sm">
                            <div class="flex items-center justify-between"><dt class="text-text-secondary">Status</dt><dd class="text-white">${shipment.status || '—'}</dd></div>
                            <div class="flex items-center justify-between"><dt class="text-text-secondary">Status Date</dt><dd class="text-white">${statusDate}</dd></div>
                            <div class="flex items-center justify-between"><dt class="text-text-secondary">Status Time</dt><dd class="text-white">${statusTime}</dd></div>
                            <div class="flex items-center justify-between"><dt class="text-text-secondary">Location</dt><dd class="text-white">${location}</dd></div>
                        </dl>
                        <div class="mt-3">
                            <h5 class="text-white font-semibold mb-1">Notes / Current Location</h5>
                        <p class="text-text-secondary text-sm">${note}</p>
                        </div>
                    </div>
                    <div class="card rounded-2xl p-6">
                        <h4 class="text-white font-semibold mb-3">Shipment Details</h4>
                        <dl class="grid grid-cols-1 gap-2 text-sm">
                            <div class="flex items-center justify-between"><dt class="text-text-secondary">Cargo Type</dt><dd class="text-white">${cargoType}</dd></div>
                            <div class="flex items-center justify-between"><dt class="text-text-secondary">Carrier Ref</dt><dd class="text-white">${carrierRef}</dd></div>
                            <div class="flex items-center justify-between"><dt class="text-text-secondary">Departure Date</dt><dd class="text-white">${departureDate}</dd></div>
                            <div class="flex items-center justify-between"><dt class="text-text-secondary">Departure Time</dt><dd class="text-white">${departureTime}</dd></div>
                        </dl>
                        <div class="mt-3">
                            <h5 class="text-white font-semibold mb-1">Comments</h5>
                            <p class="text-text-secondary text-sm">${comments}</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="card rounded-2xl p-6">
                        <h4 class="text-white font-semibold mb-2">Sender</h4>
                        <p class="text-text-secondary text-sm">${sender.name || '—'}</p>
                        <p class="text-text-secondary text-sm">${sender.email || '—'}</p>
                        <p class="text-text-secondary text-sm">${sender.phone || '—'}</p>
                        <p class="text-text-secondary text-sm">${senderStreet}</p>
                        <p class="text-text-secondary text-sm">${sender.city || '—'}, ${sender.state || '—'}, ${sender.country || '—'} ${senderPostal}</p>
                    </div>
                    <div class="card rounded-2xl p-6">
                        <h4 class="text-white font-semibold mb-2">Receiver</h4>
                        <p class="text-text-secondary text-sm">${receiver.name || '—'}</p>
                        <p class="text-text-secondary text-sm">${receiver.email || '—'}</p>
                        <p class="text-text-secondary text-sm">${receiver.phone || '—'}</p>
                        <p class="text-text-secondary text-sm">${receiverStreet}</p>
                        <p class="text-text-secondary text-sm">${receiver.city || '—'}, ${receiver.state || '—'}, ${receiver.country || '—'} ${receiverPostal}</p>
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
        
        // Wait for Firebase to be ready if configured
        function waitForFirebase(callback) {
            if (window.DB && DB.hasFirebaseConfig) {
                // Check if Firebase SDKs are loaded
                if (typeof firebase === 'undefined' || !firebase.firestore) {
                    // Wait for Firebase SDKs to load
                    let attempts = 0;
                    const checkFirebase = setInterval(() => {
                        attempts++;
                        if (typeof firebase !== 'undefined' && firebase.firestore) {
                            clearInterval(checkFirebase);
                            try {
                                DB.init();
                                callback();
                            } catch (err) {
                                console.error('Firebase init error:', err);
                                callback();
                            }
                        } else if (attempts > 50) {
                            // Give up after 5 seconds
                            clearInterval(checkFirebase);
                            console.warn('Firebase SDKs not loaded, using local storage');
                            callback();
                        }
                    }, 100);
                } else {
                    try {
                        DB.init();
                        callback();
                    } catch (err) {
                        console.error('Firebase init error:', err);
                        callback();
                    }
                }
            } else {
                // If no Firebase config, seed local store for demo
        seedIfEmpty();
                callback();
            }
        }

        // Initialize and set up form
        waitForFirebase(() => {
        // Support query param ?tn=...
        const params = new URLSearchParams(window.location.search);
        const tn = params.get('tn');
        if (tn) {
            input.value = tn;
                Promise.resolve(findByTracking(tn)).then((doc) => {
                    renderTrackingResult(result, doc, tn);
                }).catch((err) => {
                    console.error('Error finding tracking:', err);
                    renderTrackingResult(result, null, tn);
                });
            }

            form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const trackingNo = input.value.trim();
            if (!trackingNo) return;
                
                // Show loading state
                result.innerHTML = '<div class="card rounded-2xl p-6"><p class="text-text-secondary">Searching...</p></div>';
                
                try {
                    const match = await findByTracking(trackingNo);
            renderTrackingResult(result, match, trackingNo);
                } catch (err) {
                    console.error('Error finding tracking:', err);
                    renderTrackingResult(result, null, trackingNo);
                }
            });
        });
    }

    // Auto-init tracking page if present
    if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrackingPage);
    } else {
        // DOM already loaded
        initTrackingPage();
    }
})();
