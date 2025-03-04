import React, { useState } from 'react'
import styles from "./styles.module.css"
import { Button, Input, InputGroup, InputRightAddon, Select } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { createSubscriptionData, fetchSubscriptionData } from '../../../Redux/Subscription/subscriptionReducer'
import { message } from 'antd/es'
const initialState = {
    planName: "",
    timePeriod: "",
    price: "",
    userType: "PARTNER"
}

const CreateNewPlan = () => {
    const dispatch = useDispatch()
    const [form, setForm] = useState(initialState)
    console.log('form:', form)
    const navigate = useNavigate()
    const createPlan = () => {
        if (!form.planName) {
            message.error("Plan Name is Required")
        } else {
            if (!form.timePeriod) {
                message.error("Time Period is Required")
            } else {
                if (!form.price) {
                    message.error("Price is Required")
                } else {
                    dispatch(createSubscriptionData(form)).then((res) => {
                        dispatch(fetchSubscriptionData("PARTNER")); 
                        navigate("/Subscription")
                        message.success("Plan Created Successfully")

                    }).catch(err => {
                        message.error("Something went Wrong")

                    })
                }
            }
        }

    }
    return (
        <div className={styles.MainContainer}>

            <div className={styles.container1}>
                <span>
                    All Plan {'>'} <b style={{ opacity: "100%", color: "#131313" }}>Create Plan</b>
                </span>
                <h1>
                    Create New Plan
                </h1>

                <div className={styles.container}>
                    <p>Plan Name</p>
                    <Select placeholder='Choose Plan Name' onChange={(e) => setForm({ ...form, planName: e.target.value })} value={form.planName}>
                        <option value="Standard">Standard</option>
                        <option value="Silver">Silver </option>
                        <option value="Gold">Gold</option>
                    </Select>
                    <p>
                        Plan Time
                    </p>
                    <InputGroup className={styles.inputGroup}>

                        <Input placeholder='Enter Plan Time' type="Number" onChange={(e) => setForm({ ...form, timePeriod: e.target.value })} value={form.timePeriod} />
                        <InputRightAddon children='Month' className={styles.sideItem} />
                    </InputGroup>
                    <p>
                        Price
                    </p>
                    <InputGroup className={styles.inputGroup}>

                        <Input placeholder='Enter Price' type="Number" onChange={(e) => setForm({ ...form, price: e.target.value })} value={form.price} />
                        <InputRightAddon className={styles.sideItem} children='Є' />

                    </InputGroup>
                </div>

            </div>
            <div className={styles.btn}>
                <Button colorScheme='black' variant='outline' onClick={() => navigate("/Subscription")}>Cancel</Button>
                <Button bg="black" color="#fff" variant='solid' onClick={createPlan}>Save</Button>
            </div>
        </div>
    )
}

export default CreateNewPlan