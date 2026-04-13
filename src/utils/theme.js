
export function getInitialTheme() {
  try {
    if (localStorage.theme) {
      return localStorage.theme;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch (e) {
    return 'dark';
  }
}

export function setTheme(theme) {
  try {
    localStorage.theme = theme;
  } catch (e) {
    // ignore
  }
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function toggleTheme(currentTheme) {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  return newTheme;
}
