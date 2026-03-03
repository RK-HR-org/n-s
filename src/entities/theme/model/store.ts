import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
    // Read initial state from localStorage or default to false
    const savedTheme = localStorage.getItem('theme-is-dark')
    const isDark = ref(savedTheme === 'true')

    // Watch for changes and save to localStorage
    watch(isDark, (newValue) => {
        localStorage.setItem('theme-is-dark', String(newValue))
    })

    function toggleTheme() {
        isDark.value = !isDark.value
    }

    return { isDark, toggleTheme }
})
