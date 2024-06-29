'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// let map, mapEvent;

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;

    constructor (coords, distance, duration) {
        // to make sure they would work, since they are
        // being defined with cutting edge syntax
        // * this.date = new Date ()
        // * this.id = ...
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
    }

    _setDescription () {
        const months = ['January', 'February', 'March', 
            'April', 'May', 'June', 'July', 'August', 
            'September', 'October', 'November', 
            'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }

    click() {
        this.clicks++;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        // It's fine to call methods and write code in
        // the constructor
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        // min/km
        this.pace = this.duration/this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        // km/h
        this.speed = this.distance/(this.duration / 60);
        return this.speed;
    }

}

// * const run1 = new Running([39, -12], 5.2, 24, 178);
// * const cycling1 = new Cycling([39, -12], 27, 95, 523);
// * console.log(run1, cycling1);

//////////////////////////////////////////
// APPLICATION ARCHITECTURE
class App {
    // private instance properties
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];

    constructor() { 
        // GET USER'S POSITION
        this._getPosition();

        // GET DATA FROM THE LOCAL STORAGE
        this._getLocalStorage();

        //ATTACH EVENT HANDLERS
        // in addEventListener the this keyword points to the element - in that case form -, so
        // to make it work it's needed to bind the this keyword of the object
        form.addEventListener('submit', this._newWorkout.bind(this));
        // it doesn't need it since there is no use of the this keyword in that function
        inputType.addEventListener("change", this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
    }

    _getPosition() { 
        if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
            alert(`Could not get your position`);
        });
    }

    _loadMap(position) { 
        const {latitude} = position.coords;
        const {longitude} = position.coords;
        // * console.log(latitude, longitude);
        // * console.log(`https://www.google.com.br/maps/@${latitude},${longitude},13z?entry=ttu`);
        
        const cords = [latitude, longitude]
        
        this.#map = L.map('map').setView(cords, this.#mapZoomLevel);

        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        /*
        L.marker(cords)
            .addTo(map)
            .bindPopup('A pretty CSS popup.<br> Easily customizable.')
            .openPopup();
        */
        
        // * console.log(map);
        
        // "addEventListener" provided by Leaflet, used
        // to add a 'click' event to the map
        this.#map.on('click', this._showForm.bind(this));
    
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });
    }

    _showForm(mapE) { 
        // * console.log(this);
        // * console.log(this.#mapEvent);
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        // empty inputs
        inputDistance.value = inputDuration.value =
        inputElevation.value = inputCadence.value = ''; 

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);
    }

    _toggleElevationField() {  
        // toggle the input based in which type of workout is selected - running or cycling
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) { 
        const validInputs = (...inputs) => 
            inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => 
            inputs.every(inp => inp > 0);

        e.preventDefault();

        // Get data from the form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        // Validate the data

        // If workout is running, create running or
        if (type === 'running') {
            const cadence = +inputCadence.value;
            // Check if data is valid
            if (!validInputs(distance, duration, cadence)
                || !allPositive(distance, duration, cadence)) 
                return alert('Inputs have to be positive numbers!');
                
            workout = new Running([lat, lng], distance, duration, cadence)
        }

        // if is cycling, create cycling
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            // Check if data is valid
            if (!validInputs(distance, duration, elevation) ||
                    !allPositive(distance, duration)) 
                return alert('Inputs have to be positive numbers!');

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        // add new Object to workout array
        this.#workouts.push(workout);
        // * console.log(workout);

        // Render workout on map as marker
        
        this._renderWorkoutMarker(workout);

        // Render workout on list

        this._renderWorkout(workout);

        // hide form + clear input fields
        this._hideForm();

        // Set local storage to all workouts
        this._setLocalStorage();

    }

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`)
            .openPopup();   
    }

    _renderWorkout(workout) {
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                </div>
        `;

        if (workout.type === 'running')
            html += `
                    <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
            `
        if (workout.type === 'cycling')
            html += `
                    <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li> 
            `
        form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        console.log(workoutEl);

        if(!workoutEl) return;

        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        );
        // * console.log(workout);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });

        // using the api click
        // * workout.click(); disabled because of the local storage
    }

    _setLocalStorage() {
        localStorage.setItem("workouts", JSON.stringify(this.#workouts))
    }

    _getLocalStorage() {
        // this process makes the objects lose the prototype chain
        const data = JSON.parse(localStorage.getItem('workouts'));
        // * console.log(data);
        // it's possible to loop over the objects and restore
        // the inheritance
        if (!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app = new App();






/*


    form.addEventListener('submit', function(e) {
        e.preventDefault();

        //clear input fields
        inputDistance.value = inputCadence.value 
        = inputElevation.value = inputDuration.value
        = '';

        // actual coordinates of the click, within the 
        // event 'mapEvent'
        const { lat, lng } = mapEvent.latlng;
    
        // popup added and opened 
        // .marker() creates the marker with the
        // right coords while the .addTo() adds them
        // to the map
        // before the tileLayer was generated and added
        // to the map right after
        // bindPopup() creates the popup and binds it to the 
        // map.
        // It's possible to customize it as it's stated 
        // in the documentation
        L.marker([lat, lng]).addTo(map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: "running-popup",
            }))
            .setPopupContent('Workout')
            .openPopup();

                
    });

    inputType.addEventListener("change", function () {

        // toggle the input based in which type of workout is selected - running or cycling
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    });


    */



///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////

/*
1. User stories -> description of the application's
functionality from the user's perspective - all users
stories put together describe the entire application
2. Features -> described by the user stories
3. Flowchart -> WHAT we will build
4. Architecture -> HOW we will buid it
5. The implementation of our plan using code


// 1) User story:
Common format: as a [type of user],
I want [an action] so that [a benefit]
Who - user, admin, etc... -; what and why.

- Example:
As a user, I want to log my running workouts with
location, distance, time, pace and steps/minute, so I
can keep a log of all my running

Which means all the different functionalities a type of user
may want - put yourself in the user perspective
to set the features needed for the application

Each user story may be used to think 
of a lot of features

*/

