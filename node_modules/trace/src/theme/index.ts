export const theme = {
  colors: {
    primary: '#0B4EE3', // Vibrant blue from template
    primaryDark: '#0A3BBA',
    primaryLight: '#477BFA',
    background: '#F8FAFC', // Very light blue-gray background
    surface: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    error: '#EF4444',
    success: '#10B981',
    border: '#E2E8F0',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    fontFamily: 'System', 
    h1: { fontSize: 30, fontWeight: 'bold' as const },
    h2: { fontSize: 22, fontWeight: '700' as const },
    body: { fontSize: 15, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
  }
};
