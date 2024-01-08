// import localStorage from "localStorage";

export const useLocalStorage = (name) => {

    const getLocalStorage = () => {
        const local = localStorage.getItem(name)
        if(local != null){
            return JSON.parse(local)
        }
        return null
    }

    const setLocalStorage = (item) => {  
        localStorage.setItem(name, JSON.stringify(item))
    }  

    const removeLocalStorage = () => {
        return localStorage.removeItem(name)  
    }

    return [getLocalStorage, setLocalStorage, removeLocalStorage]
}

export const useSessionStorage = (name) => {

    const getSessionStorage = () => {
        const local = sessionStorage.getItem(name)
        if(local != null || local === ''){
            return JSON.parse(local)
        }
        return null
    }

    const setSessionStorage = (item) => {  
        sessionStorage.setItem(name, JSON.stringify(item))
    }  

    const removeSessionStorage = () => {
        return sessionStorage.removeItem(name)  
    }

    return [getSessionStorage, setSessionStorage, removeSessionStorage]
}