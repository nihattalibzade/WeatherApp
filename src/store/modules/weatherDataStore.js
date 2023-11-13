import Vue from "vue";
import WeatherService from '@/services/weatherService.js'

const state = {
    currentWeatherData: null,
    dailyForecastData: [],
    hourlyForecastData: [],
    isLoading: false,
    isErrorThrown: false
}

const mutations = {
    setCurrentWeatherData(state, currentWeather) {
        state.currentWeatherData = {
            city: currentWeather?.name,
            temperature: `${String(Math.round(Number(currentWeather?.main?.temp)))}°`,
            description: currentWeather?.weather[0]?.description,
            feelsLike: `${String(Math.round(Number(currentWeather?.main?.feels_like)))}°`,
            humidity: `${currentWeather?.main?.humidity}%`,
            pressure: `${currentWeather?.main?.pressure} mb`,
            wind: `${String(Math.round(Number(currentWeather?.wind?.speed)))} km/h`,
            icon: currentWeather?.weather[0]?.icon
        };
    },

    setHourlyForecastData(state, dailyForecast) {
        state.hourlyForecastData = {...dailyForecast}.list.slice(0, 6).map(forecast => {
            return {
                icon: forecast.weather[0].icon,
                description: forecast.weather[0].description,
                temperature: `${String(Math.round(Number(forecast.main.temp)))}°`,
                time: new Date(forecast.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        });
    },

    setDailyForecastData(state, dailyForecast) {
        const groupedByDay = {};
        dailyForecast.list.forEach(forecast => {
            const date = new Date(forecast.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' });
            if (!groupedByDay[date]) {
                groupedByDay[date] = [];
            }
            groupedByDay[date].push(forecast);
        });

        // Calculate daily averages
        state.dailyForecastData = Object.keys(groupedByDay).map((date, index) => {
            const temperatures = groupedByDay[date].map(forecast => forecast?.main?.temp);
            const averageTemperature = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
            const description = index === 0 ? groupedByDay[date][0].weather[0].description : groupedByDay[date][0]?.weather[0].description;
            const icon = index === 0 ? groupedByDay[date][0]?.weather[0].icon : groupedByDay[date][0]?.weather[0].icon;
            return {
                date: date,
                averageTemperature: `${Math.round(averageTemperature)}°`,
                description,
                icon
            };
        });
    },

    setLoading(state, isLoading) {
        state.isLoading = isLoading;
    },

    setErrorThrown(state, isErrorThrown) {
        state.isErrorThrown = isErrorThrown;
    },

    /*addManufacturerFilterResults(state, results) {
        Vue.set(state.productsFilteredByManufacturerName, results.filter, results.products);
    },*/
}

const getters = {
    getCurrentWeather(state) {
        return state.currentWeatherData;
    },

    getDailyForecast(state) {
        return state.dailyForecastData;
    },

    getHourlyForecast(state) {
        return state.hourlyForecastData;
    },

    getIsLoading(state) {
        return state.isLoading;
    },

    getIsErrorThrown(state) {
        return state.isErrorThrown;
    },
}

const actions = {
    fetchCurrentWeather({ commit }, city = Vue.prototype.$constVariables.defaultCityToSearch) {
        WeatherService.fetchWeather(city, Vue.prototype.$constVariables.apiForecastTypes.CURRENT)
            .then(currentWeatherResponse => {
                console.log('currentWeatherResponse: ', currentWeatherResponse)
                commit('setCurrentWeatherData', currentWeatherResponse)
            })
            .catch(() => commit('setErrorThrown', true));
    },

    fetchWeatherForecast({ commit }, city = Vue.prototype.$constVariables.defaultCityToSearch) {
        WeatherService.fetchWeather(city, Vue.prototype.$constVariables.apiForecastTypes.DAILY_FORECAST)
            .then(weatherForecast => {
                commit('setHourlyForecastData', weatherForecast);
                commit('setDailyForecastData', weatherForecast);

                setTimeout(() => {
                    commit('setLoading', false);
                }, 1500)
            })
            .catch(() => {
                commit('setErrorThrown', true)
                commit('setLoading', false);
            });
    },
}

export default {
    state,
    getters,
    mutations,
    actions
}