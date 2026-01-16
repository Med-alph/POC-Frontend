export const EMAIL_TEMPLATE_TYPES = {
    APPOINTMENT_BOOK: 'appointment_book',
    APPOINTMENT_RESCHEDULE: 'appointment_reschedule',
    APPOINTMENT_CANCEL: 'appointment_cancel',
};

export const TEMPLATE_LABELS = {
    [EMAIL_TEMPLATE_TYPES.APPOINTMENT_BOOK]: 'Appointment Booking',
    [EMAIL_TEMPLATE_TYPES.APPOINTMENT_RESCHEDULE]: 'Appointment Rescheduling',
    [EMAIL_TEMPLATE_TYPES.APPOINTMENT_CANCEL]: 'Appointment Cancellation',
};

export const PLACEHOLDERS = {
    ALL: ['{{doctor_name}}', '{{patient_name}}', '{{appointment_date}}'],
    [EMAIL_TEMPLATE_TYPES.APPOINTMENT_BOOK]: ['{{appointment_time}}', '{{clinic_address}}'],
    [EMAIL_TEMPLATE_TYPES.APPOINTMENT_RESCHEDULE]: ['{{old_date}}', '{{new_date}}', '{{new_time}}'],
    [EMAIL_TEMPLATE_TYPES.APPOINTMENT_CANCEL]: [],
};
