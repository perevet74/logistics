// Lightweight Firestore wrapper with optional Auth for admin-only writes
(function () {
    const hasFirebaseConfig = !!(window.firebaseConfig && window.firebaseConfig.projectId);

    let app = null;
    let db = null;
    let auth = null;

    function init() {
        if (!hasFirebaseConfig || !window.firebase || !window.firebase.firestore) {
            return { ready: false, reason: 'missing_config' };
        }
        if (app) return { ready: true };
        app = firebase.initializeApp(window.firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        return { ready: true };
    }

    // Auth helpers
    function onAuth(cb) {
        if (!auth) return () => {};
        return auth.onAuthStateChanged(cb);
    }

    function signIn(email, password) {
        if (!auth) throw new Error('Auth not initialized');
        return auth.signInWithEmailAndPassword(email, password);
    }

    function signOut() {
        if (!auth) throw new Error('Auth not initialized');
        return auth.signOut();
    }

    // Security: Only allow owner writes by rules (enforced server-side),
    // but we also gate UI by allowed email list if provided.
    function isAllowedUser(user) {
        if (!user) return false;
        const list = Array.isArray(window.adminEmailAllowlist) ? window.adminEmailAllowlist : [];
        if (list.length === 0) return true; // if no list, allow any signed-in user
        return list.includes(user.email);
    }

    // Shipments collection helpers
    function shipmentsCol() {
        if (!db) throw new Error('DB not initialized');
        return db.collection('shipments');
    }

    function toDocData(input) {
        // Ensure consistent schema
        const now = Date.now();
        return {
            trackingNo: input.trackingNo,
            sender: input.sender,
            receiver: input.receiver,
            status: input.status,
            cargoType: input.cargoType || '',
            statusDate: input.statusDate || '',
            statusTime: input.statusTime || '',
            location: input.location || '',
            carrierRef: input.carrierRef || '',
            departureDate: input.departureDate || '',
            departureTime: input.departureTime || '',
            comments: input.comments || '',
            origin: input.origin,
            destination: input.destination,
            notes: input.notes || '',
            featuredImage: input.featuredImage || null,
            createdAt: input.createdAt || now,
            updatedAt: now
        };
    }

    function onShipmentsSnapshot(cb) {
        return shipmentsCol()
            .orderBy('updatedAt', 'desc')
            .onSnapshot((snap) => {
                const arr = [];
                snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
                cb(arr);
            }, (error) => {
                console.error('Firestore snapshot error:', error);
                alert('Error loading shipments: ' + error.message);
            });
    }

    async function createShipment(data) {
        const doc = toDocData(data);
        const ref = await shipmentsCol().add(doc);
        return { id: ref.id, ...doc };
    }

    async function updateShipment(id, data) {
        const doc = toDocData({ ...data, createdAt: data.createdAt });
        await shipmentsCol().doc(id).set(doc, { merge: true });
        return { id, ...doc };
    }

    async function deleteShipment(id) {
        await shipmentsCol().doc(id).delete();
    }

    async function findShipmentByTracking(trackingNo) {
        const q = await shipmentsCol().where('trackingNo', '==', trackingNo).limit(1).get();
        if (q.empty) return null;
        const d = q.docs[0];
        return { id: d.id, ...d.data() };
    }

    // Exported API on window
    window.DB = {
        init,
        onAuth,
        signIn,
        signOut,
        isAllowedUser,
        onShipmentsSnapshot,
        createShipment,
        updateShipment,
        deleteShipment,
        findShipmentByTracking,
        hasFirebaseConfig
    };
})();


