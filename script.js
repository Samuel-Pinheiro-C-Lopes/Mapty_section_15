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

if (navigator.geolocation)
    navigator.geolocation.getCurrentPosition(
    function(position) {
        const {latitude} = position.coords;
        const {longitude} = position.coords;
        console.log(latitude, longitude);
        console.log(`https://www.google.com.br/maps/@${latitude},${longitude},13z?entry=ttu`);
        
        const cords = [latitude, longitude]
        
        const map = L.map('map').setView(cords, 12);

        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

        L.marker(cords).addTo(map)
            .bindPopup('A pretty CSS popup.<br> Easily customizable.')
            .openPopup();
    
    }, function() {
        alert(`Could not get your position`);
    });

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

