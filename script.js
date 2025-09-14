(function() {
  'use strict';

  // API Configuration
  const API_BASE = "/o/c/proposetechnologies";
  const LIST_TYPE_BASE = "/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code";
  const CSRF_TOKEN = "AMUFtlQN"; // Updated CSRF token from working request
  // Liferay Objects attachment upload action (updated to match gecko form boundary specification)
  // Uses objectFieldId=51132 and specific form field name format
  // Note: p_auth will be replaced dynamically from Liferay.authToken when available
  const OBJECT_ATTACHMENT_UPLOAD_URL = "https://automation.netways1.com/group/control_panel/manage?p_p_id=com_liferay_object_web_internal_object_definitions_portlet_ObjectDefinitionsPortlet_Y2A6&p_p_lifecycle=1&_com_liferay_object_web_internal_object_definitions_portlet_ObjectDefinitionsPortlet_Y2A6_javax.portlet.action=/object_entries/upload_attachment&_com_liferay_object_web_internal_object_definitions_portlet_ObjectDefinitionsPortlet_Y2A6_objectFieldId=51132&p_auth=wlDPhavo";
  
  // CSRF token helpers (added)
  async function getCsrfToken() {
    if (window.Liferay?.authToken) return Liferay.authToken;
    try {
      const r = await fetch('/o/csrf-token', { credentials: 'include' });
      if (r.ok) return (await r.json())?.token || '';
    } catch (_) {}
    return '';
  }

  async function defaultHeaders() {
    const t = await getCsrfToken();
    const h = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
    if (t) h['x-csrf-token'] = t;
    return h;
  }
  
  // Picklist External Reference Codes
  const PICKLIST_CODES = {
    technologyType: "d15070a3-0f9b-fcd0-8a29-a1539948efe4",
    technologyProvider: "30ef3f81-9ef4-1111-53ee-03a6cfb36ea7", 
    associatedSector: "f4055a21-a368-2d54-94fe-049b15a6394b",
    technologySource: "a068e1f5-99ad-2b4b-7778-d1a5fad9d85c",
    valueAdd: "2565312e-79be-da18-c2a8-b246bbcbec8d",
    potentialDevCos: "64221172-b394-d31c-c145-d8d6f5d0e3f1"
  };
  
  let editingId = null;
  let currentTechnologyId = null; // Track the current technology ID
  let picklistOptions = {
    technologyType: [],
    technologyProvider: [],
    associatedSector: [],
    technologySource: [],
    valueAdd: [],
    potentialDevCos: []
  };

  // Fallback options when APIs fail
  const FALLBACK_OPTIONS = {
    technologyType: [
      { value: "AI_ML", label: "AI & ML" },
      { value: "BIG_DATA", label: "Big Data & Analytics" },
      { value: "IOT", label: "IoT" },
      { value: "ROBOTICS", label: "Robotics" },
      { value: "CLOUD", label: "Cloud" }
    ],
    technologyProvider: [
      { value: "XYZ_SMART", label: "XYZ Smart Transit Solutions" },
      { value: "ABC_MOBILITY", label: "ABC Mobility" },
      { value: "URBANTECH", label: "UrbanTech" }
    ],
    associatedSector: [
      { value: "MOBILITY", label: "Mobility" },
      { value: "ENERGY", label: "Energy" },
      { value: "HEALTHCARE", label: "Healthcare" }
    ],
    technologySource: [
      { value: "DESKTOP_RESEARCH", label: "Desktop Research" },
      { value: "VC", label: "VC" },
      { value: "EXPOS_CONFERENCES", label: "Expos and conferences" },
      { value: "INNOVATION_HUB", label: "Innovation Hub" }
    ],
    valueAdd: [
      { value: "COST_REDUCTION", label: "Cost reduction" },
      { value: "TIME_SAVING", label: "Time saving" },
      { value: "RISK_REDUCTION", label: "Risk reduction" },
      { value: "CUSTOMER_SATISFACTION", label: "Customer satisfaction" }
    ],
    potentialDevCos: [
      { value: "NEOM", label: "NEOM" },
      { value: "SAUDI_RAILWAY", label: "Saudi Railway Company" },
      { value: "ARDARA", label: "ARDARA" },
      { value: "RED_SEA_GLOBAL", label: "Red Sea Global" }
    ]
  };

  // Load picklist options from Liferay API
  async function loadPicklistOptions(picklistKey, externalReferenceCode) {
    try {
      console.log(`Loading ${picklistKey} options from API...`);
      const data = await makeApiRequest(`${LIST_TYPE_BASE}/${externalReferenceCode}`);
      
      console.log(`API Response for ${picklistKey}:`, data);
      
      const entries = Array.isArray(data.listTypeEntries) ? data.listTypeEntries : [];
      
      // Check if the picklist is empty
      if (entries.length === 0) {
        console.warn(`⚠️ ${picklistKey} picklist is empty (no listTypeEntries), using fallback options`);
        picklistOptions[picklistKey] = FALLBACK_OPTIONS[picklistKey] || [];
        return picklistOptions[picklistKey];
      }
      
      console.log(`📊 Found ${entries.length} entries for ${picklistKey}:`, entries);
      
      // Get language preference
      const lang = (typeof Liferay !== 'undefined' && Liferay.ThemeDisplay && Liferay.ThemeDisplay.getBCP47LanguageId) 
        ? Liferay.ThemeDisplay.getBCP47LanguageId() 
        : "en-US";
      
      picklistOptions[picklistKey] = entries.map(entry => ({
        value: entry.key,
        label: (entry.name_i18n && (entry.name_i18n[lang] || entry.name_i18n["en-US"])) || entry.name || entry.key
      }));
      
      console.log(`✅ Loaded ${picklistKey} options from API (${entries.length} entries):`, picklistOptions[picklistKey]);
      return picklistOptions[picklistKey];
    } catch (error) {
      console.warn(`⚠️ Failed to load ${picklistKey} options from API, using fallback:`, error.message);
      
      // Use fallback options
      picklistOptions[picklistKey] = FALLBACK_OPTIONS[picklistKey] || [];
      
      // Show warning but don't show error to user unless it's critical
      if (error.message.includes('403') || error.message.includes('401')) {
      }
      
      console.log(`📋 Using fallback ${picklistKey} options:`, picklistOptions[picklistKey]);
      return picklistOptions[picklistKey];
    }
  }

  // Load all picklist options
  async function loadAllPicklistOptions() {
    console.log('🔄 Loading all picklist options...');
    
    const loadPromises = Object.entries(PICKLIST_CODES).map(([key, code]) => 
      loadPicklistOptions(key, code)
    );
    
    try {
      const results = await Promise.all(loadPromises);
      
      // Summary of loaded options
      const summary = Object.keys(picklistOptions).map(key => ({
        picklist: key,
        count: picklistOptions[key].length,
        source: picklistOptions[key].length === (FALLBACK_OPTIONS[key]?.length || 0) ? 'fallback' : 'API'
      }));
      
      console.log('📊 Picklist loading summary:', summary);
      console.log('📋 All picklist options loaded:', picklistOptions);
      
      // Show summary to user
      const apiCount = summary.filter(s => s.source === 'API').length;
      const fallbackCount = summary.filter(s => s.source === 'fallback').length;
      
      if (apiCount > 0 && fallbackCount > 0) {
      } else if (apiCount === summary.length) {
      } else {
      }
      
      updateFormWithPicklistOptions();
    } catch (error) {
      console.error('Error loading some picklist options:', error);
      updateFormWithPicklistOptions();
    }
  }

  // Update form elements with loaded picklist options
  function updateFormWithPicklistOptions() {
    // Update Technology Provider select
    const providerSelect = document.querySelector('select[name="provider"]');
    if (providerSelect && picklistOptions.technologyProvider.length > 0) {
      const currentValue = providerSelect.value;
      providerSelect.innerHTML = '<option value="">Select option</option>' + 
        picklistOptions.technologyProvider
          .map(opt => `<option value="${opt.value}" ${opt.value === currentValue ? 'selected' : ''}>${opt.label}</option>`)
          .join('');
      
      // Always set default to empty (no pre-selection)
      providerSelect.value = '';
    }

    // Update multiselects with new options
    updateMultiselectOptions('tech-type', picklistOptions.technologyType);
    updateMultiselectOptions('devcos', picklistOptions.potentialDevCos);
    
    // Update checkboxes
    updateCheckboxOptions('source[]', picklistOptions.technologySource);
    updateCheckboxOptions('addedValue[]', picklistOptions.valueAdd);
  }

  // Simple multiselect implementation that works reliably
  function updateMultiselectOptions(elementId, options) {
    const multiselectEl = document.getElementById(elementId);
    if (!multiselectEl) {
      console.warn(`Multiselect element ${elementId} not found`);
      return;
    }
    
    if (options.length === 0) {
      console.warn(`No options provided for multiselect ${elementId}`);
      return;
    }

    console.log(`🔄 Rebuilding multiselect ${elementId} with ${options.length} options:`, options);

    // Clear any existing state
    multiselectEl.className = 'multiselect';
    multiselectEl.setAttribute('data-options', JSON.stringify(options.map(opt => opt.label)));
    
    // Rebuild the entire multiselect structure
    multiselectEl.innerHTML = `
      <div class="multiselect-values" aria-live="polite"></div>
      <button type="button" class="multiselect-toggle" aria-haspopup="listbox" aria-expanded="false" aria-label="Open options"></button>
      <div class="multiselect-menu" role="listbox" aria-multiselectable="true"></div>
    `;
    
    const valuesEl = multiselectEl.querySelector('.multiselect-values');
    const toggleEl = multiselectEl.querySelector('.multiselect-toggle');
    const menuEl = multiselectEl.querySelector('.multiselect-menu');
    const hiddenName = multiselectEl.dataset.name || 'values[]';
    
    // Track selected options
    const selectedOptions = new Set();
    
    // Build menu options
    options.forEach(function(opt) {
      const optionEl = document.createElement('div');
      optionEl.className = 'multiselect-option';
      optionEl.setAttribute('role', 'option');
      optionEl.setAttribute('aria-selected', 'false');
      optionEl.textContent = opt.label;
      optionEl.setAttribute('data-value', opt.value);
      
      // Option click handler
      optionEl.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log(`✅ Option selected: ${opt.label} (key: ${opt.value})`);
        
        if (selectedOptions.has(opt.value)) {
          // Deselect
          selectedOptions.delete(opt.value);
          optionEl.setAttribute('aria-selected', 'false');
          
          // Remove chip
          const chip = valuesEl.querySelector(`[data-value="${opt.value}"]`);
          if (chip) chip.remove();
          
          // Remove hidden input
          const hiddenInput = multiselectEl.querySelector(`input[type="hidden"][value="${opt.value}"]`);
          if (hiddenInput) hiddenInput.remove();
          
        } else {
          // Select
          selectedOptions.add(opt.value);
          optionEl.setAttribute('aria-selected', 'true');
          
          // Add chip (display label but store key)
          const chip = document.createElement('span');
          chip.className = 'chip';
          chip.setAttribute('data-value', opt.value);
          chip.innerHTML = `${opt.label}<span class="chip-remove" aria-label="Remove ${opt.label}"></span>`;
          
          // Chip remove handler
          chip.querySelector('.chip-remove').addEventListener('click', function(e) {
            e.stopPropagation();
            selectedOptions.delete(opt.value);
            optionEl.setAttribute('aria-selected', 'false');
            chip.remove();
            
            // Remove hidden input
            const hiddenInput = multiselectEl.querySelector(`input[type="hidden"][value="${opt.value}"]`);
            if (hiddenInput) hiddenInput.remove();
          });
          
          valuesEl.appendChild(chip);
          
          // Add hidden input (store the key, not the label)
          const hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.name = hiddenName;
          hidden.value = opt.value; // Store the key for API submission
          multiselectEl.appendChild(hidden);
        }
        
        // Update toggle button text (handled by CSS pseudo-element when empty)
        // No need to set text content as CSS handles the placeholder
      });
      
      menuEl.appendChild(optionEl);
    });
    
    // Initialize toggle button (text handled by CSS pseudo-element)
    toggleEl.textContent = '';
    
    // Make entire multiselect area clickable
    multiselectEl.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const isOpen = multiselectEl.classList.contains('open');
      console.log(`🖱️ Multiselect clicked for ${elementId}, currently ${isOpen ? 'open' : 'closed'}`);
      
      // Close all other multiselects
      document.querySelectorAll('.multiselect.open').forEach(ms => {
        if (ms !== multiselectEl) {
          ms.classList.remove('open');
          const toggle = ms.querySelector('.multiselect-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
      });
      
      if (isOpen) {
        multiselectEl.classList.remove('open');
        toggleEl.setAttribute('aria-expanded', 'false');
        console.log(`❌ Closed ${elementId}`);
      } else {
        multiselectEl.classList.add('open');
        toggleEl.setAttribute('aria-expanded', 'true');
        console.log(`✅ Opened ${elementId}`);
      }
    });
    
    // Close when clicking outside
    document.addEventListener('click', function(e) {
      if (!multiselectEl.contains(e.target)) {
        multiselectEl.classList.remove('open');
        toggleEl.setAttribute('aria-expanded', 'false');
      }
    });
    
    console.log(`✅ Multiselect ${elementId} rebuilt and ready`);
  }

  // Update checkbox group options
  function updateCheckboxOptions(name, options) {
    const container = document.querySelector(`input[name="${name}"]`)?.closest('.checkboxes');
    if (!container || options.length === 0) return;

    // Get currently checked values
    const checkedValues = Array.from(container.querySelectorAll(`input[name="${name}"]:checked`))
      .map(input => input.value);

    // Clear and rebuild
    container.innerHTML = options.map(opt => `
      <label>
        <input type="checkbox" name="${name}" value="${opt.value}" ${checkedValues.includes(opt.value) ? 'checked' : ''}> 
        ${opt.label}
      </label>
    `).join('');
  }

  // Utility function to get form data
  async function getFormData() {
    const form = document.getElementById('tech-form');
    const formData = new FormData(form);
    
    // Get multiselect values from hidden inputs (generated by multiselect component)
    const technologyTypes = Array.from(document.querySelectorAll('input[name="technologyTypes[]"]'))
      .map(input => input.value);
    const devcos = Array.from(document.querySelectorAll('input[name="devcos[]"]'))
      .map(input => input.value);
    
    // Get checkbox values
    const sources = Array.from(document.querySelectorAll('input[name="source[]"]:checked'))
      .map(input => input.value);
    const addedValues = Array.from(document.querySelectorAll('input[name="addedValue[]"]:checked'))
      .map(input => input.value);

    // Get Liferay user name if available
    const getOwnerName = () => {
      if (typeof Liferay !== 'undefined' && Liferay.ThemeDisplay) {
        const userName = Liferay.ThemeDisplay.getUserName();
        return userName || "Ibrahim Al-Asiri";
      }
      return "Ibrahim Al-Asiri";
    };

    // Build the payload according to your field structure
    // Note: Field names must match exactly what Liferay expects
    const payload = {
      stage: "Screening", // readonly value from form
      owner: getOwnerName(), // Get from Liferay or fallback
      associatedSector: "Mobility", // readonly value from form
    };

    // Only add fields that have values to avoid API errors
    const title = formData.get('title');
    if (title) payload.technologyTitle = title;

    const description = formData.get('description');
    if (description) payload.technologyDescription = description;

    const provider = formData.get('provider');
    if (provider && provider !== '') {
      console.log('Provider selected:', provider);
      // technologyProvider is a picklist field - send as object with key
      payload.technologyProvider = { key: provider };
    }

    // Include multiselect/picklist fields in the payload
    // Based on the API response, these fields expect specific formats
    
    if (technologyTypes.length > 0) {
      console.log('Technology types selected:', technologyTypes);
      // For multiselect picklist, send as array of strings
      payload.technologyTypeMulti = technologyTypes;
    }

    if (sources.length > 0) {
      console.log('Technology sources selected:', sources);
      payload.technologySource = sources;
    }

    if (devcos.length > 0) {
      console.log('Potential DevCos selected:', devcos);
      payload.potentialDevCos = devcos;
    }

    if (addedValues.length > 0) {
      console.log('Value add selected:', addedValues);
      payload.valueAdd = addedValues;
    }

    // Add boolean and date fields
    const relevantRadio = document.querySelector('input[name="relevant"]:checked');
    if (relevantRadio) {
      payload.relevantToABusinessChallenge = relevantRadio.value === 'yes';
    }

    // Always include dateTime for updates in YYYY-MM-DD HH:mm format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    payload.dateAndTime = `${year}-${month}-${day} ${hours}:${minutes}`;

    // Include technology ID if we're updating
    if (currentTechnologyId) {
      payload.technologyID = currentTechnologyId;
    }

    // Handle file upload if present (for Step 1)
    const fileInput = document.getElementById('file-input');
    if (fileInput && fileInput.files.length > 0) {
      console.log('File detected in Step 1, uploading...');
      try {
        const uploadResult = await uploadFile(fileInput.files[0]);
        if (uploadResult && uploadResult.id) {
          payload.attachment = uploadResult.id;
          console.log('File uploaded and linked:', uploadResult.id);
        }
      } catch (error) {
        console.error('File upload failed:', error);
        showMessage(`File upload failed: ${error.message}`, 'error');
      }
    }

    // Debug: Show what we're sending
    console.log('📤 Complete payload being sent:', payload);
    
    return payload;
  }

  // Get authentication headers dynamically (deprecated in favor of defaultHeaders)

  // API Functions
  async function makeApiRequest(url, options = {}) {
    const baseHeaders = await defaultHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // Include cookies for authentication
        headers: { ...baseHeaders, ...(options.headers || {}) }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Request failed: ${response.status} ${response.statusText}`, errorText);
        
        if (response.status === 403) {
          throw new Error(`Authentication failed (403 Forbidden). Please check your login status and permissions.`);
        } else if (response.status === 401) {
          throw new Error(`Unauthorized (401). Please log in to Liferay.`);
        } else {
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // GET all records
  async function loadTechnologies() {
    try {
      const data = await makeApiRequest(`${API_BASE}?pageSize=20`);
      console.log('Loaded technologies:', data);
      
      // You can implement table display here if needed
      displayTechnologies(data.items || []);
      
      return data;
    } catch (error) {
      showMessage(`❌ Error loading technologies: ${error.message}`, 'error');
      return { items: [] };
    }
  }

  // POST new record
  async function createTechnology(technologyData) {
    try {
      const data = await makeApiRequest(API_BASE, {
        method: 'POST',
        body: JSON.stringify(technologyData)
      });
      
      return data;
    } catch (error) {
      showMessage(`❌ Error creating technology: ${error.message}`, 'error');
      throw error;
    }
  }

  // PUT update record
  async function updateTechnology(id, technologyData) {
    try {
      const data = await makeApiRequest(`${API_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(technologyData)
      });
      
      return data;
    } catch (error) {
      showMessage(`❌ Error updating technology: ${error.message}`, 'error');
      throw error;
    }
  }

  // DELETE record
  async function deleteTechnology(id) {
    // Show custom confirmation dialog
    const confirmed = await showConfirmDialog('Are you sure you want to delete this technology record?');
    if (!confirmed) {
      return false;
    }

    try {
      await makeApiRequest(`${API_BASE}/${id}`, {
        method: 'DELETE'
      });
      
      return true;
    } catch (error) {
      showMessage(`❌ Error deleting technology: ${error.message}`, 'error');
      return false;
    }
  }

  // Display technologies (you can customize this based on your UI needs)
  function displayTechnologies(technologies) {
    console.log('Displaying technologies:', technologies);
    // Implement your display logic here
    // For now, just logging to console
  }

  // Show/Hide loading indicator
  function showLoading(message = 'Loading...') {
    let loadingEl = document.getElementById('api-loading');
    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.id = 'api-loading';
      loadingEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px 30px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: #666;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        backdrop-filter: blur(4px);
      `;
      
      // Add spinner
      const spinner = document.createElement('div');
      spinner.style.cssText = `
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #C4984F;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      `;
      
      // Add CSS animation
      if (!document.getElementById('spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
      
      loadingEl.appendChild(spinner);
      loadingEl.appendChild(document.createTextNode(message));
      document.body.appendChild(loadingEl);
    } else {
      loadingEl.style.display = 'flex';
      loadingEl.lastChild.textContent = message;
    }
  }

  function hideLoading() {
    const loadingEl = document.getElementById('api-loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  }

  // Show user messages
  function showMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('api-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'api-message';
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      `;
      document.body.appendChild(messageEl);
    }

    messageEl.textContent = message;
    messageEl.className = `message-${type}`;
    
    // Style based on type
    const styles = {
      success: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
      error: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
      info: { backgroundColor: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' }
    };
    
    Object.assign(messageEl.style, styles[type] || styles.info);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (messageEl && messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 5000);
  }

  // Show page loading screen
  function showPageLoading(message = 'Loading...') {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'page-loading-screen';
    loadingScreen.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">${message}</div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #page-loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 1;
        transition: opacity 0.3s ease-out;
      }
      
      .loading-content {
        text-align: center;
        color: #333;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }
      
      .loading-text {
        font-size: 16px;
        font-weight: 500;
        color: #666;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(loadingScreen);
    
    return loadingScreen;
  }

  // Hide page loading screen
  function hidePageLoading() {
    const loadingScreen = document.getElementById('page-loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          loadingScreen.parentNode.removeChild(loadingScreen);
        }
      }, 300);
    }
  }

  // Show success message with same design
  function showSuccessMessage(message) {
    const successEl = document.createElement('div');
    successEl.className = 'success-message';
    successEl.innerHTML = `
      <div class="success-icon">✅</div>
      <div class="success-text">${message}</div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .success-message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 1;
        transform: translateX(0);
        transition: all 0.3s ease-out;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .success-icon {
        font-size: 18px;
        flex-shrink: 0;
      }
      
      .success-text {
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(successEl);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      successEl.style.opacity = '0';
      successEl.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        if (successEl.parentNode) {
          successEl.parentNode.removeChild(successEl);
        }
      }, 300);
    }, 4000);
  }

  // Show custom confirmation dialog
  function showConfirmDialog(message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        opacity: 0;
        transition: opacity 0.3s ease-out;
      `;
      
      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        text-align: center;
        transform: scale(0.9);
        transition: transform 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      
      dialog.innerHTML = `
        <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 15px;">
          Confirm Action
        </div>
        <div style="font-size: 14px; color: #666; margin-bottom: 25px; line-height: 1.5;">
          ${message}
        </div>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="confirm-cancel" style="
            padding: 10px 20px;
            border: 1px solid #ddd;
            background: white;
            color: #666;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
          ">Cancel</button>
          <button id="confirm-ok" style="
            padding: 10px 20px;
            border: none;
            background: #dc3545;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
          ">Delete</button>
        </div>
      `;
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      // Animate in
      setTimeout(() => {
        overlay.style.opacity = '1';
        dialog.style.transform = 'scale(1)';
      }, 10);
      
      // Button handlers
      document.getElementById('confirm-cancel').addEventListener('click', () => {
        cleanup();
        resolve(false);
      });
      
      document.getElementById('confirm-ok').addEventListener('click', () => {
        cleanup();
        resolve(true);
      });
      
      // Click outside to cancel
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      });
      
      function cleanup() {
        overlay.style.opacity = '0';
        dialog.style.transform = 'scale(0.9)';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }
    });
  }

  // Upload file to Liferay Documents API
  async function uploadFile(file) {
    if (!file) {
      throw new Error('No file selected');
    }

    console.log('📤 Uploading file:', file.name, 'Size:', file.size);

    // Use FormData with Liferay object field name format
    // Field name matches the gecko form boundary specification:
    // Content-Disposition: form-data; name="_com_liferay_object_web_internal_object_definitions_portlet_ObjectDefinitionsPortlet_Y2A6_file"
    const formData = new FormData();
    formData.append('_com_liferay_object_web_internal_object_definitions_portlet_ObjectDefinitionsPortlet_Y2A6_file', file);
    
    console.log('📋 FormData field name: _com_liferay_object_web_internal_object_definitions_portlet_ObjectDefinitionsPortlet_Y2A6_file');
    console.log('📋 File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Build the Liferay Objects attachment upload URL with dynamic p_auth and current origin
    function buildAttachmentUploadUrl() {
      try {
        const url = new URL(OBJECT_ATTACHMENT_UPLOAD_URL, location.origin);
        // Force current origin (protocol/host) in case the provided URL points to a different env
        url.protocol = location.protocol;
        url.host = location.host;
        // Prefer dynamic CSRF from getCsrfToken when possible, else fallback to Liferay.authToken/CSRF_TOKEN
        // Note: this function remains sync; token is appended later before fetch
        return url.toString();
      } catch (e) {
        return OBJECT_ATTACHMENT_UPLOAD_URL;
      }
    }

    // Try preferred Objects attachment action first
    const csrfToken = await getCsrfToken();
    const baseUrl = buildAttachmentUploadUrl();
    const attachmentUrl = (() => {
      try {
        const u = new URL(baseUrl, location.origin);
        if (csrfToken) u.searchParams.set('p_auth', csrfToken);
        return u.toString();
      } catch (_) { return baseUrl; }
    })();
    
    console.log('🔗 Upload URL:', attachmentUrl);
    console.log('📋 Using Liferay Objects attachment upload endpoint');
    
    try {
      // For Liferay object attachment upload, we need minimal headers
      // Let the browser set Content-Type with boundary for multipart/form-data
      const objHeaders = {};
      const authToken = await getCsrfToken();
      if (authToken) {
        objHeaders['x-csrf-token'] = authToken;
        console.log('🔐 Using CSRF token for authentication');
      }
      
      const res = await fetch(attachmentUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: objHeaders
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Objects upload failed (${res.status}): ${text}`);
      }

      // Liferay object attachment actions may return JSON or HTML
      let data;
      const contentType = res.headers.get('content-type') || '';
      
      console.log('📥 Response status:', res.status);
      console.log('📥 Response content-type:', contentType);
      
      try {
        if (contentType.includes('application/json')) {
          data = await res.json();
          console.log('📥 JSON response:', data);
        } else {
          const text = await res.text();
          console.log('📥 Text response preview:', text.substring(0, 200) + '...');
          
          // Try to extract file ID from various possible response formats
          const fileEntryIdMatch = text.match(/"fileEntryId"\s*:\s*(\d+)/);
          const attachmentIdMatch = text.match(/"attachmentId"\s*:\s*(\d+)/);
          const idMatch = text.match(/"id"\s*:\s*(\d+)/);
          
          if (fileEntryIdMatch) {
            data = { fileEntryId: Number(fileEntryIdMatch[1]) };
          } else if (attachmentIdMatch) {
            data = { id: Number(attachmentIdMatch[1]) };
          } else if (idMatch) {
            data = { id: Number(idMatch[1]) };
          } else {
            // For object attachment uploads, success might just be a redirect or empty response
            // If we get a 200 status, assume success and generate a placeholder ID
            data = { 
              id: Date.now(), // Temporary ID for tracking
              success: true,
              raw: text.substring(0, 500) // Keep some of the response for debugging
            };
          }
        }
      } catch (parseError) {
        console.warn('⚠️ Could not parse response, but upload may have succeeded:', parseError);
        data = { 
          id: Date.now(), // Temporary ID for tracking
          success: true,
          parseError: parseError.message
        };
      }

      const normalized = {
        id: data?.fileEntryId || data?.id || Date.now(),
        raw: data
      };

      console.log('✅ File uploaded via Objects action:', normalized);
      return normalized;
    } catch (err) {
      console.warn('⚠️ Objects attachment upload failed, falling back to Headless Delivery:', err.message);

      // Fallback: upload to Documents via Headless Delivery
      try {
        const headers = await defaultHeaders();
        // Ensure we do NOT set Content-Type so browser sets multipart boundary
        delete headers['Content-Type'];

        const res2 = await fetch('/o/headless-delivery/v1.0/documents', {
          method: 'POST',
          credentials: 'include',
          headers,
          body: formData
        });

        if (!res2.ok) {
          const text = await res2.text();
          throw new Error(`Headless upload failed (${res2.status}): ${text}`);
        }

        const data2 = await res2.json();
        const normalized2 = {
          id: data2?.id || data2?.fileEntryId,
          raw: data2
        };

        if (!normalized2.id) {
          throw new Error('Headless upload returned no ID');
        }

        console.log('✅ File uploaded via Headless Delivery:', normalized2);
        return normalized2;
      } catch (fallbackErr) {
        console.error('❌ File upload failed in both methods:', fallbackErr);
        throw fallbackErr;
      }
    }
  }

  // Delete file from Liferay Documents API
  async function deleteFile(fileId) {
    if (!fileId) {
      throw new Error('No file ID provided');
    }

    console.log('🗑️ Deleting file:', fileId);

    const response = await makeApiRequest(`/o/headless-delivery/v1.0/documents/${fileId}`, {
      method: 'DELETE'
    });

    console.log('✅ File deleted successfully:', response);
    return response;
  }

  // Handle file deletion
  async function handleFileDeletion(fileId) {
    const confirmed = await showConfirmDialog('Are you sure you want to delete this file?');
    if (!confirmed) {
      return false;
    }

    try {
      showLoading('Deleting file...');
      
      await deleteFile(fileId);
      
      hideLoading();
      showSuccessMessage('✅ File deleted successfully');
      
      // Clear the file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Clear any file list display
      const fileList = document.getElementById('file-list');
      if (fileList) {
        fileList.innerHTML = '';
      }
      
      return true;
    } catch (error) {
      hideLoading();
      console.error('❌ File deletion failed:', error);
      showMessage(`❌ File deletion failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Display uploaded file with delete option
  function displayUploadedFile(fileInfo) {
    const fileList = document.getElementById('file-list');
    if (!fileList) return;

    // Get file icon based on type
    const getFileIcon = (type) => {
      if (type.startsWith('image/')) return '🖼️';
      if (type === 'application/pdf') return '📄';
      if (type.includes('word') || type.includes('document')) return '📝';
      if (type === 'text/plain') return '📄';
      return '📎';
    };

    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;

    fileItem.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="
          width: 40px;
          height: 40px;
          background: #007bff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 16px;
        ">
          ${getFileIcon(fileInfo.type)}
        </div>
        <div>
          <div style="font-weight: 500; color: #333; font-size: 14px;">
            ${fileInfo.name || 'Uploaded File'}
          </div>
          <div style="color: #666; font-size: 12px;">
            Size: ${fileInfo.size ? Math.round(fileInfo.size / 1024) + ' KB' : 'Unknown'} • ${fileInfo.type ? fileInfo.type.split('/')[1]?.toUpperCase() || 'FILE' : 'FILE'}
          </div>
        </div>
      </div>
      <button type="button" class="delete-file-btn" style="
        background: #dc3545;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: background 0.2s ease;
      " data-file-id="${fileInfo.id}">
        Delete
      </button>
    `;

    // Add delete button handler
    const deleteBtn = fileItem.querySelector('.delete-file-btn');
    deleteBtn.addEventListener('click', async () => {
      const fileId = deleteBtn.getAttribute('data-file-id');
      const success = await handleFileDeletion(fileId);
      if (success) {
        fileItem.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => fileItem.remove(), 300);
      }
    });

    // Add hover effect
    deleteBtn.addEventListener('mouseenter', () => {
      deleteBtn.style.background = '#c82333';
    });
    deleteBtn.addEventListener('mouseleave', () => {
      deleteBtn.style.background = '#dc3545';
    });

    fileList.appendChild(fileItem);
  }

  // Initialize drag and drop functionality
  function initDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    
    if (!dropzone || !fileInput) return;

    // Browse button handler
    const browseBtn = dropzone.querySelector('[data-action="browse"]');
    if (browseBtn) {
      browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
      });
    }

    // File input change handler
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileUpload();
      }
    });

    // Drag and drop handlers
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.background = '#f0f8ff';
      dropzone.style.borderColor = '#007bff';
    });

    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.background = '';
      dropzone.style.borderColor = '';
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.background = '';
      dropzone.style.borderColor = '';

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        // Set the file to the input
        fileInput.files = files;
        handleFileUpload();
      }
    });

    // Click handler for dropzone
    dropzone.addEventListener('click', (e) => {
      if (e.target === dropzone || e.target.closest('.dropzone-inner')) {
        fileInput.click();
      }
    });
  }

  // Validate file before upload
  function validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (file.size > maxSize) {
      throw new Error(`File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type not supported. Allowed types: PNG, JPG, GIF, PDF, TXT, DOC, DOCX`);
    }
    
    return true;
  }

  // Handle file upload for Step 3
  async function handleFileUpload() {
    const fileInput = document.getElementById('file-input');
    if (!fileInput || !fileInput.files.length) {
      console.log('No file selected for upload');
      return null;
    }

    const file = fileInput.files[0];
    if (!file) {
      console.log('No file selected');
      return null;
    }

    // Validate file
    try {
      validateFile(file);
    } catch (error) {
      showMessage(`❌ ${error.message}`, 'error');
      return null;
    }

    // Disable all buttons during upload
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.6';
    });

    try {
      showLoading(`Uploading ${file.name}...`);
      
      const uploadResult = await uploadFile(file);
      
      hideLoading();
      showSuccessMessage(`✅ File uploaded successfully: ${file.name}`);
      
      // Display the uploaded file with delete option
      displayUploadedFile({
        id: uploadResult.id,
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Clear the file input
      fileInput.value = '';
      
      return uploadResult;
    } catch (error) {
      hideLoading();
      console.error('❌ File upload failed:', error);
      showMessage(`❌ File upload failed: ${error.message}`, 'error');
      return null;
    } finally {
      // Re-enable all buttons after upload
      buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
      });
    }
  }

  // Handle form submission
  async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = await getFormData();
    console.log('Form data to submit:', formData);
    
    showLoading('Saving technology data...');
    
    try {
      let result;
      
      // Always update if we have a currentTechnologyId (from initial creation)
      if (currentTechnologyId) {
        console.log('Updating existing technology record:', currentTechnologyId);
        result = await updateTechnology(currentTechnologyId, formData);
      } else {
        // Fallback: create new if no ID exists
        console.log('Creating new technology record');
        result = await createTechnology(formData);
        
        // Store the technology ID for future updates
        if (result && result.id) {
          currentTechnologyId = result.id;
          
          // Update the Technology ID display field
          const techIdInput = document.querySelector('input[value="78232223"]');
          if (techIdInput) {
            techIdInput.value = result.id;
          }
        }
      }
      
      hideLoading();
      console.log('✅ Form submission successful:', result);
      
      // Don't interfere with step progression - let the original form logic handle it
      // The original script will automatically move to step 2 after form submission
      console.log('🔄 Letting original script handle step progression...');
      
    } catch (error) {
      hideLoading();
      console.error('❌ Form submission error:', error);
      showMessage(`❌ Failed to save: ${error.message}`, 'error');
    }
  }

  // Debug authentication status
  function debugAuthStatus() {
    console.log('🔍 Debugging Authentication Status:');
    console.log('- Liferay object available:', typeof Liferay !== 'undefined');
    
    if (typeof Liferay !== 'undefined') {
      console.log('- Liferay.authToken:', Liferay.authToken ? '✅ Available' : '❌ Missing');
      console.log('- Liferay.ThemeDisplay:', Liferay.ThemeDisplay ? '✅ Available' : '❌ Missing');
      
      if (Liferay.ThemeDisplay) {
        console.log('- User ID:', Liferay.ThemeDisplay.getUserId());
        console.log('- Company ID:', Liferay.ThemeDisplay.getCompanyId());
        console.log('- Scope Group ID:', Liferay.ThemeDisplay.getScopeGroupId());
      }
    }
    
    console.log('- Hardcoded CSRF Token:', CSRF_TOKEN);
    defaultHeaders().then(h => console.log('- Current headers:', h));
  }

  // Test API connectivity
  async function testApiConnectivity() {
    console.log('🧪 Testing API Connectivity...');
    debugAuthStatus();
    
    try {
      // Test main API first
      console.log('Testing main API:', API_BASE);
      const mainApiTest = await makeApiRequest(`${API_BASE}?pageSize=1`);
      console.log('✅ Main API accessible:', mainApiTest);
      
      // Test one picklist API
      const testPicklist = Object.entries(PICKLIST_CODES)[0];
      console.log(`Testing picklist API: ${testPicklist[0]}`);
      const picklistTest = await makeApiRequest(`${LIST_TYPE_BASE}/${testPicklist[1]}`);
      console.log('✅ Picklist API accessible:', picklistTest);
      
      return true;
    } catch (error) {
      console.error('❌ API Connectivity Test Failed:', error);
      showMessage(`API connectivity test failed: ${error.message}. Using fallback data.`, 'info');
      return false;
    }
  }

  // Create initial technology record with basic data
  async function createInitialTechnology() {
    console.log('🆕 Creating initial technology record...');
    showLoading('Initializing new technology record...');
    
    try {
      // Get Liferay user name if available
      const getOwnerName = () => {
        if (typeof Liferay !== 'undefined' && Liferay.ThemeDisplay) {
          const userName = Liferay.ThemeDisplay.getUserName();
          return userName || "Ibrahim Al-Asiri";
        }
        return "Ibrahim Al-Asiri";
      };

      // Create minimal initial record with only basic required fields
      const initialData = {
        stage: "Screening",
        owner: getOwnerName(),
        associatedSector: "Mobility"
        // Note: technologyID is auto-increment, handled by Liferay
        // Don't include picklist fields (technologyType, technologyProvider, etc.) in initial creation
        // They will be added when user fills and submits the form
      };

      const result = await createTechnology(initialData);
      
      if (result && result.id) {
        currentTechnologyId = result.id;
        
        // Update the Technology ID display field
        const techIdInput = document.querySelector('input[value="78232223"]');
        if (techIdInput) {
          techIdInput.value = result.id;
        }
        
        // Update the Owner field display with real user name
        const ownerInput = document.querySelector('input[value="Ibrahim Al-Asiri"]');
        if (ownerInput && result.owner) {
          ownerInput.value = result.owner;
        }
        
        console.log('✅ Initial technology record created with ID:', currentTechnologyId);
        hideLoading();
      }
      
      return result;
    } catch (error) {
      hideLoading();
      console.error('❌ Failed to create initial technology record:', error);
      return null;
    }
  }

  // Remove default selections from multiselects
  function removeDefaultSelections() {
    console.log('🔄 Removing default multiselect selections...');
    
    // Clear multiselect components
    document.querySelectorAll('.multiselect').forEach(ms => {
      if (ms.__reset && typeof ms.__reset === 'function') {
        // Clear the state first
        const valuesEl = ms.querySelector('.multiselect-values');
        const hiddenInputs = ms.querySelectorAll('input[type="hidden"]');
        
        // Remove all chips and hidden inputs
        if (valuesEl) valuesEl.innerHTML = '';
        hiddenInputs.forEach(input => input.remove());
        
        // Update option states
        ms.querySelectorAll('.multiselect-option').forEach(opt => {
          opt.setAttribute('aria-selected', 'false');
        });
      }
    });
    
    console.log('✅ Default selections removed');
  }

  // Initialize the API integration
  async function initApiIntegration() {
    console.log('🚀 Initializing Technology API integration...');
    
    // Show page loading screen
    showPageLoading('Initializing technology form...');
    
    showLoading('Initializing form...');
    
    try {
      // Test connectivity first
      const apiWorking = await testApiConnectivity();
      
      // Load picklist options (will use fallback if API fails)
      await loadAllPicklistOptions();
      
      // Wait a bit for the existing multiselect initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Remove default multiselect selections
      removeDefaultSelections();
      
      // Initialize drag and drop functionality
      initDragAndDrop();
      
      // Create initial technology record if API is working
      if (apiWorking) {
        await createInitialTechnology();
        await loadTechnologies();
      }
      
      // Add our API handler without interfering with existing form logic
      const form = document.getElementById('tech-form');
      if (form) {
        // Add our handler to run BEFORE the original submit handler
        form.addEventListener('submit', function(e) {
          // Only handle step 1 - let original logic handle step progression
          const currentStep = document.querySelector('.step:not([hidden])')?.dataset.step;
          if (currentStep === '1') {
            console.log('🔄 Our form handler running for step 1...');
            handleFormSubmit(e);
          }
        }, true); // Use capture phase to run first
      }

    // Debug multiselect function
    function debugMultiselect(elementId) {
      const multiselectEl = document.getElementById(elementId);
      if (!multiselectEl) {
        console.error(`❌ Multiselect ${elementId} not found`);
        return;
      }
      
      console.log(`🔍 Debugging multiselect ${elementId}:`);
      console.log('- Element:', multiselectEl);
      console.log('- Classes:', multiselectEl.className);
      console.log('- Data options:', multiselectEl.getAttribute('data-options'));
      
      const toggleEl = multiselectEl.querySelector('.multiselect-toggle');
      console.log('- Toggle element:', toggleEl);
      console.log('- Toggle aria-expanded:', toggleEl?.getAttribute('aria-expanded'));
      
      const menuEl = multiselectEl.querySelector('.multiselect-menu');
      console.log('- Menu element:', menuEl);
      console.log('- Menu children:', menuEl?.children.length);
      
      const valuesEl = multiselectEl.querySelector('.multiselect-values');
      console.log('- Values element:', valuesEl);
      console.log('- Selected chips:', valuesEl?.querySelectorAll('.chip').length);
      
      // Test click
      if (toggleEl) {
        console.log('🖱️ Testing toggle click...');
        toggleEl.click();
        
        // Wait a moment and check if it opened
        setTimeout(() => {
          const isOpen = multiselectEl.classList.contains('open');
          console.log(`After click test: ${isOpen ? 'OPENED' : 'STILL CLOSED'}`);
          
          if (!isOpen) {
            console.log('⚠️ Manual force open attempt...');
            multiselectEl.classList.add('open');
            toggleEl.setAttribute('aria-expanded', 'true');
            console.log('✅ Manually forced open');
          }
        }, 100);
      }
    }
    
    // Force open multiselect function
    function forceOpenMultiselect(elementId) {
      const multiselectEl = document.getElementById(elementId);
      if (!multiselectEl) {
        console.error(`❌ Multiselect ${elementId} not found`);
        return;
      }
      
      console.log(`🔓 Force opening multiselect ${elementId}`);
      
      // Close others first
      document.querySelectorAll('.multiselect.open').forEach(ms => {
        ms.classList.remove('open');
        const toggle = ms.querySelector('.multiselect-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      });
      
      // Open this one
      multiselectEl.classList.add('open');
      const toggleEl = multiselectEl.querySelector('.multiselect-toggle');
      if (toggleEl) {
        toggleEl.setAttribute('aria-expanded', 'true');
      }
      
      console.log(`✅ Force opened multiselect ${elementId}`);
    }

    // Make functions globally available for potential external use
    window.technologyAPI = {
      load: loadTechnologies,
      create: createTechnology,
      update: updateTechnology,
      delete: deleteTechnology,
      getFormData: getFormData,
      loadPicklistOptions: loadAllPicklistOptions,
      getCurrentTechnologyId: () => currentTechnologyId,
      debugAuth: debugAuthStatus,
      testConnectivity: testApiConnectivity,
      createInitial: createInitialTechnology,
      debugMultiselect: debugMultiselect,
      forceOpenMultiselect: forceOpenMultiselect
    };

      hideLoading();
        console.log('✅ Technology API integration initialized successfully');
        
        // Hide page loading and show success message
        hidePageLoading();
        
      } catch (error) {
        hideLoading();
        hidePageLoading();
        console.error('❌ API integration initialization failed:', error);
      }
  }

  // Handle step 2 and step 3 data updates
  async function handleStepUpdate(stepNumber) {
    if (!currentTechnologyId) {
      console.warn('No technology ID available for step update');
      return;
    }

    const updateData = {};
    
    // Always include current dateTime for updates
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    updateData.dateAndTime = `${year}-${month}-${day} ${hours}:${minutes}`;

    if (stepNumber === 2) {
      // Get Step 2 data
      const devcos = Array.from(document.querySelectorAll('input[name="devcos[]"]'))
        .map(input => input.value);
      const relevantToChallenge = document.querySelector('input[name="relevant"]:checked')?.value === 'yes';
      const addedValues = Array.from(document.querySelectorAll('input[name="addedValue[]"]:checked'))
        .map(input => input.value);

      // Include multiselect data in step 2 updates
      console.log('Step 2 - DevCos selected:', devcos);
      console.log('Step 2 - Value add selected:', addedValues);
      
      // Include all step 2 data
      updateData.relevantToABusinessChallenge = relevantToChallenge;
      
      if (devcos.length > 0) {
        updateData.potentialDevCos = devcos;
      }
      
      if (addedValues.length > 0) {
        updateData.valueAdd = addedValues;
      }
    }

    if (stepNumber === 3) {
      // Handle file upload
      console.log('Step 3 - Handling file upload...');
      
      const uploadResult = await handleFileUpload();
      if (uploadResult && uploadResult.id) {
        updateData.attachment = uploadResult.id;
        console.log('File linked to technology record:', uploadResult.id);
      }
    }

    // Update the technology record
    if (Object.keys(updateData).length > 0) {
      updateTechnology(currentTechnologyId, updateData)
        .then(() => {
          console.log(`Step ${stepNumber} data updated successfully`);
        })
        .catch(error => {
          console.error(`Error updating step ${stepNumber} data:`, error);
        });
    }
  }

  // Prevent multiple initializations
  let isInitialized = false;

  // Wait for DOM and existing scripts to be ready
  function waitForExistingScripts() {
    if (isInitialized) {
      console.log('⚠️ API integration already initialized, skipping');
      return;
    }
    
    // Check if the existing form initialization is complete
    const checkInterval = setInterval(() => {
      const form = document.getElementById('tech-form');
      const multiselects = document.querySelectorAll('.multiselect');
      
      if (form && multiselects.length > 0) {
        clearInterval(checkInterval);
        isInitialized = true;
        // Wait a bit more to ensure all existing scripts are done
        setTimeout(initApiIntegration, 500);
      }
    }, 100);
  }

  // Hook into existing step navigation to save data without interfering
  function hookStepNavigation() {
    console.log('🔗 Setting up step navigation hooks...');
    
    // Find the Save & Continue button
    const btnSave = document.getElementById('btn-save');
    if (!btnSave) {
      console.warn('Save button not found');
      return;
    }

    // Add our data saving logic that runs BEFORE the original handlers
    btnSave.addEventListener('click', async function(e) {
      const currentStep = document.querySelector('.step:not([hidden])')?.dataset.step;
      console.log('💾 Our save handler - Step:', currentStep);
      
      // Save data for step 2 and 3
      if (currentStep === '2') {
        console.log('📝 Saving Step 2 data in background...');
        await handleStepUpdate(2);
      } else if (currentStep === '3') {
        console.log('📝 Saving Step 3 data with file upload...');
        e.preventDefault(); // Prevent default navigation for Step 3
        await handleStepUpdate(3);
        return; // Don't let original handler run
      }
      
      // Don't prevent default for other steps - let the original step navigation work
      // The original script will handle the step progression
    }, true); // Use capture phase to run before other handlers
    
    console.log('✅ Step navigation hooks set up (non-interfering)');
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      waitForExistingScripts();
      setTimeout(hookStepNavigation, 1000); // Hook after everything is initialized
    });
  } else {
    waitForExistingScripts();
    setTimeout(hookStepNavigation, 1000);
  }

})();
