export const theme = {
  colors: {
    primary: '#1A56DB', // Vibrant Blue
    primaryDark: '#1E40AF',
    primaryLight: '#3B82F6',
    background: '#F3F4F6', // Light gray background
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    error: '#EF4444',
    success: '#10B981',
    border: '#E5E7EB',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    // Note: To actually use Inter, the font files need to be linked in RN.
    fontFamily: 'System', 
    h1: { fontSize: 32, fontWeight: 'bold' as const },
    h2: { fontSize: 24, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
  }
};
