import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

const apiRequest = async (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const token = getAuthToken();
  
  const config = {
    method: 'GET',
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token && !options.skipAuth && { Authorization: `Bearer ${token}` }),
    },
  };

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData) && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Handle 404 as empty result (no annotations found)
      if (response.status === 404) {
        return null;
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    // Handle empty response body
    const text = await response.text();
    if (!text) {
      return null;
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
};

const imagesAPI = {
  // Upload session with images
  uploadSession: async (patientId, formData) => {
    return apiRequest(`/api/patients/${patientId}/sessions/upload`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  },

  // Get presigned URL for S3 upload
  getPresignedUrl: async (fileName, fileType) => {
    return apiRequest('/api/upload/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName, file_type: fileType }),
    });
  },

  // Get all sessions for a patient
  getPatientSessions: async (patientId) => {
    return apiRequest(`/api/patients/${patientId}/sessions`);
  },

  // Set session as baseline
  setBaseline: async (sessionId) => {
    return apiRequest(`/api/sessions/${sessionId}/baseline`, {
      method: 'PATCH',
    });
  },

  // Update session notes
  updateNotes: async (sessionId, notes) => {
    return apiRequest(`/api/sessions/${sessionId}/notes`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  },

  // Delete session (soft delete)
  deleteSession: async (sessionId) => {
    return apiRequest(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  // Delete single image (soft delete)
  deleteImage: async (imageId) => {
    return apiRequest(`/api/images/${imageId}`, {
      method: 'DELETE',
    });
  },

  // Mark session as reviewed
  markSessionReviewed: async (sessionId, reviewedBy) => {
    return apiRequest(`/api/sessions/${sessionId}/review`, {
      method: 'POST',
      body: JSON.stringify({ reviewed_by: reviewedBy }),
    });
  },

  // Comparison notes
  saveComparisonNotes: async (patientId, comparisonData) => {
    return apiRequest(`/api/patients/${patientId}/comparison-notes`, {
      method: 'POST',
      body: JSON.stringify(comparisonData),
    });
  },

  getComparisonNotes: async (patientId) => {
    return apiRequest(`/api/patients/${patientId}/comparison-notes`);
  },

  updateComparisonNotes: async (noteId, notes) => {
    return apiRequest(`/api/comparison-notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  },

  // Image Annotations
  saveAnnotations: async (patientId, imageUrl, side, annotationData, createdBy) => {
    return apiRequest('/image-annotations', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: patientId,
        image_url: imageUrl,
        side: side,
        annotations: annotationData.annotations,
        annotation_count: annotationData.annotationCount || 0,
        created_by: createdBy
      }),
    });
  },

  getAnnotations: async (patientId, imageUrl) => {
    const params = new URLSearchParams({
      patient_id: patientId,
      image_url: imageUrl
    });
    return apiRequest(`/image-annotations?${params.toString()}`);
  },

  getPatientAnnotations: async (patientId) => {
    return apiRequest(`/image-annotations?patient_id=${patientId}`);
  },

  updateAnnotations: async (annotationId, annotationData) => {
    return apiRequest(`/image-annotations/${annotationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        annotations: annotationData.annotations,
        annotation_count: annotationData.annotationCount || 0
      }),
    });
  },

  deleteAnnotations: async (annotationId) => {
    return apiRequest(`/image-annotations/${annotationId}`, {
      method: 'DELETE',
    });
  },
};

export default imagesAPI;
