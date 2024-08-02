import React, { useState, useEffect } from 'react';
import moment from 'moment-timezone';
import Slider from 'react-slider';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { FaCalendarAlt } from "react-icons/fa";
import { RiDraggable } from "react-icons/ri";
import { FaCalendarMinus } from "react-icons/fa";
import { BiSortAlt2 } from "react-icons/bi";
import { FaLink } from "react-icons/fa";
import { MdDarkMode } from "react-icons/md";
import { MdLightMode } from "react-icons/md";
import 'react-datepicker/dist/react-datepicker.css';
import "./TimezoneConverter.css";

import { DndContext, closestCorners } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const generateInitialTimes = () => ({
    'Asia/Kolkata': moment().tz('Asia/Kolkata').format('HH:mm'),
    UTC: moment().tz('UTC').format('HH:mm'),
});

const generateInitialTimezones = () => ({
    'Asia/Kolkata': 'Asia/Kolkata',
    UTC: 'UTC',
});

function generateSliderMarks() {
    const marks = [];
    const numMarks = 25;

    const markSpacing = 1440 / (numMarks - 1);
    for (let i = 0; i < numMarks; i++) {
        const markPosition = i * markSpacing;
        marks.push(markPosition);
    }

    return marks;
}

const getTimezoneAbbr = (zone) => {
    return moment.tz(zone).format('z');
};


const getTimezoneOffset = (zone) => {
    const offset = moment.tz(zone).format('Z');
    return `GMT ${offset}`;
};


const generateTimeOptions = () => {
    const options = [];
    for (let i = 0; i < 96; i++) {
        const hour = Math.floor(i / 4);
        const minute = (i % 4) * 15;
        const time = moment().startOf('day').add(hour, 'hours').add(minute, 'minutes').format('h:mm A');
        options.push({ value: `${hour}:${minute < 10 ? '0' : ''}${minute}`, label: time });
    }
    return options;
};


const TimezoneConverter = () => {
    const [selectedTimes, setSelectedTimes] = useState(generateInitialTimes());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [reverseOrder, setReverseOrder] = useState(false);
    const [timezones, setTimezones] = useState(generateInitialTimezones());
    const [isDark, setIsDark] = useState(() => JSON.parse(localStorage.getItem('isDark')) || false);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        localStorage.setItem('isDark', JSON.stringify(isDark));
    }, [isDark]);

    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    const handleTimeChange = (zone, value) => {
        const updatedDateTime = moment(selectedDate).startOf('day').add(value, 'minutes').format('YYYY-MM-DD HH:mm');
        const updatedTimes = { ...selectedTimes, [zone]: moment(updatedDateTime).format('HH:mm') };

        Object.keys(timezones).forEach(tz => {
            if (tz !== zone) {
                updatedTimes[tz] = moment.tz(updatedDateTime, timezones[zone]).tz(timezones[tz]).format('HH:mm');
            }
        });

        setSelectedTimes(updatedTimes);
    };

    const addNewTimezone = (option) => {
        const label = option.value;
        const zone = label.replace(/\//g, '-');
        setTimezones({ ...timezones, [zone]: label });
        setSelectedTimes({ ...selectedTimes, [zone]: moment().tz(label).format('HH:mm') });
    };

    const removeTimezone = (zone) => {
        const newTimezones = { ...timezones };
        delete newTimezones[zone];
        const newSelectedTimes = { ...selectedTimes };
        delete newSelectedTimes[zone];
        setSelectedTimes(newSelectedTimes);
        setTimezones(newTimezones);
    };

    const allTimezones = moment.tz.names().map(tz => ({ value: tz, label: tz }));


    const timeOptions = generateTimeOptions();

    const reverseTimezones = () => {
        setReverseOrder(!reverseOrder);
    };

    const onDragEnd = ({ active, over }) => {
        if (active.id !== over.id) {
            const oldIndex = timezoneEntries.findIndex(([zone]) => zone === active.id);
            const newIndex = timezoneEntries.findIndex(([zone]) => zone === over.id);

            const reorderedEntries = arrayMove(timezoneEntries, oldIndex, newIndex);
            setSelectedTimes(Object.fromEntries(reorderedEntries));
        }
    };

    let timezoneEntries = Object.entries(selectedTimes);

    if (reverseOrder) {
        timezoneEntries = timezoneEntries.reverse();
    }

    const Container = ({ zone, time }) => {
        const [localTime, setLocalTime] = useState(moment.duration(time, 'HH:mm').asMinutes());

        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: zone });
        const style = { transform: CSS.Transform.toString(transform), transition };

        const handleSliderChange = (value) => {
            setLocalTime(value);
        };

        const handleSliderChangeComplete = (value) => {
            handleTimeChange(zone, value);
        };

        const handleTimeSelectChange = (selectedOption) => {
            setLocalTime(moment.duration(selectedOption.value).asMinutes());
            handleTimeChange(zone, moment.duration(selectedOption.value).asMinutes());
        };

        useEffect(() => {
            setLocalTime(moment.duration(time, 'HH:mm').asMinutes());
        }, [time]);

        const formatDisplayTime = (zone, minutes) => {
            const updatedDateTime = moment(selectedDate).startOf('day').add(minutes, 'minutes').format('YYYY-MM-DD HH:mm');
            return moment.tz(updatedDateTime, timezones[zone]).format('h:mm A');
        };


        const formatDisplayDate = (zone, minutes) => {
            const updatedDateTime = moment(selectedDate).startOf('day').add(minutes, 'minutes').format('YYYY-MM-DD HH:mm');
            return moment.tz(updatedDateTime, timezones[zone]).format('ddd D, MMMM');
        };

        const labels = ["12AM", "3AM", "6AM", "9AM", "12PM", "3PM", "6PM", "9PM"]

        return (
            <div className={'zone-container'} id={isDark && 'dark-zone-container'} ref={setNodeRef} style={style} >
                <div className='zone-upper-row'>
                    <div className='drag-button' {...listeners} {...attributes}><RiDraggable /><RiDraggable /><RiDraggable /><RiDraggable /></div>
                    <div className='zone-left-box'>
                        <h1 style={isDark ? { color: 'white' } : {}}>{getTimezoneAbbr(timezones[zone])}</h1>
                        <p>{zone.replace(/-/g, '/')}</p>
                    </div>
                    <div className='zone-right-box'>
                        <Select
                            className={"time-picker"}
                            classNamePrefix="select"
                            placeholder={formatDisplayTime(zone, localTime)}
                            value={timeOptions.find(option => moment.duration(option.value).asMinutes() === localTime)}
                            options={timeOptions}
                            onChange={handleTimeSelectChange}
                            styles={{
                                indicatorsContainer: () => ({ display: 'none' }),
                                container: (prev) => ({ ...prev, width: '15vw', height: '8vh' }),
                                placeholder: (prev) => ({ ...prev, fontSize: '1.5rem', fontWeight: 'bold', color: isDark ? 'white' : 'black', }),
                                valueContainer: (prev) => ({
                                    ...prev,
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    borderRadius: '0.5vh',
                                    color: isDark ? 'white' : 'black',
                                    backgroundColor: isDark ? '#2c2f34ef' : 'white',
                                })
                            }}
                        />
                        <span>
                            <span>{getTimezoneOffset(zone)}</span>
                            <span>{formatDisplayDate(zone, localTime)}</span>
                        </span>
                    </div>
                    <button className='remove' onClick={() => removeTimezone(zone)}>x</button>
                </div>
                <Slider
                    className="time-slider"
                    thumbClassName="time-thumb"
                    trackClassName={isDark ? 'time-track dark-time-track' : 'time-track'}
                    markClassName="time-mark"
                    marks={generateSliderMarks()}
                    min={0}
                    max={1440}
                    step={15}
                    value={localTime}
                    onChange={handleSliderChange}
                    onAfterChange={handleSliderChangeComplete}
                    renderThumb={(props, state) => <div {...props}>||</div>}
                    renderMark={(props) => <span {...props} />}
                />
                {labels && (
                    <div className="labels">
                        {generateSliderMarks()
                            .filter((mark, index) => mark % 180 === 0)
                            .map((mark, index) => (
                                <div key={mark}>{labels[index]}</div>
                            ))}
                    </div>
                )}

            </div>
        );
    };

    return (
        <div className="main-container" id={isDark && 'dark-main-container'}>
            <h1 style={{ margin: '3vh 0', color: 'gray' }}>Time Converter</h1>
            <div className='upper-row' id={isDark && 'dark-upper-row'}>
                <Select
                    className="basic-single"
                    classNamePrefix="select"
                    placeholder={"Add Time Zone, City or Town"}
                    isSearchable={true}
                    name="timezone"
                    options={allTimezones}
                    onChange={addNewTimezone}
                    styles={{
                        container: (prev) => ({
                            ...prev,
                            width: "30vw",
                            height: '5vh',
                        }),
                        valueContainer: (prev) => ({
                            ...prev,
                            width: "30vw",
                            height: '6vh',
                            borderRadius: '0.5vh 0 0 0.5vh',
                            backgroundColor: isDark ? '#2c2f34ef' : 'white',
                        }),
                        indicatorsContainer: (prev) => ({
                            ...prev,
                            borderRadius: '0 0.5vh 0.5vh 0',
                            backgroundColor: isDark ? '#2c2f34ef' : 'white',
                        })
                    }}
                />
                <div className='date-container'>
                    <DatePicker
                        className={isDark ? 'date-picker dark-date-picker' : 'date-picker'}
                        id='date-picker'
                        selected={selectedDate}
                        onChange={handleDateChange}
                        dateFormat="MMMM d, yyyy"
                    />
                    <label className='calendar-box' htmlFor="date-picker"
                        style={isDark ? { backgroundColor: '#2c2f34ef', borderRadius: '0 1vh 1vh 0' } : {}}>
                        <FaCalendarAlt />
                    </label>
                </div>

                <div className='filter-container'>
                    <div><FaCalendarMinus /></div>
                    <div onClick={reverseTimezones}><BiSortAlt2 /></div>
                    <div onClick={() => setIsSharing(!isSharing)}><FaLink /></div>
                    <div onClick={() => setIsDark(prev => !prev)}>{isDark ? <MdLightMode /> : <MdDarkMode />}</div>
                </div>
            </div>

            {isSharing &&
                <div className='link-row' id={isDark && 'dark-link-row'}>
                    <input className='link-input' type="text" value={`https://localhost:5173/?time=&date=`} />
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <span style={{ display: 'flex' }}>
                            <input type="checkbox" name="time" id="time" />
                            <label htmlFor='time' >Include Time</label>
                            <input type="time" name="" id="" />
                        </span>
                        <span style={{ display: 'flex' }}>
                            <input type="checkbox" name="date" id="date" />
                            <label htmlFor='date' >Include Date</label>
                            <input type="date" name="" id="" />
                        </span>
                    </div>
                </div>
            }

            <DndContext collisionDetection={closestCorners} onDragEnd={onDragEnd}>
                <div className='time-converter'>
                    <SortableContext items={timezoneEntries.map(([zone]) => zone)} strategy={verticalListSortingStrategy}>
                        {timezoneEntries.map(([zone, time]) => (
                            <Container key={zone} zone={zone} time={time} />
                        ))}
                    </SortableContext>
                </div>
            </DndContext >
        </div>
    );
};

export default TimezoneConverter;