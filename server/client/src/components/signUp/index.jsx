import { useState } from 'react';
import { TextField, Button, Stack } from '@mui/material';
import { createUser } from '../../services/domainRequest/userRequest';
import { setLoginSession } from '../../services/authService';

export default function SignUp({ setIsLoggedIn }) {
    const [email, setEmail] = useState();
    const [password, setPassword] = useState();
    const [firstName, setFirstName] = useState();
    const [lastName, setLastName] = useState();
    const [phone, setPhone] = useState();

    const onEmailChange = (event) => {
        setEmail(event.target.value);
    }

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    }

    const onFirstNameChange = (event) => {
        setFirstName(event.target.value);
    }

    const onLastNameChange = (event) => {
        setLastName(event.target.value);
    }

    const onPhoneChange = (event) => {
        setPhone(event.target.value);
    }

    const onSubmit = async () => {
        const data = await createUser({ email, password, firstName, lastName, phone });
        if (data && !data.error) {
            setLoginSession(data);
            setIsLoggedIn(true);
        }
    };

    return (
        <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField key="first-name" label="First Name" value={firstName} onChange={onFirstNameChange} size="small" fullWidth />
            <TextField key="last-name" label="Last Name" value={lastName} onChange={onLastNameChange} size="small" fullWidth />
            <TextField key="email" label="Email" type="email" value={email} onChange={onEmailChange} size="small" fullWidth />
            <TextField key="phone" label="Phone Number" value={phone} onChange={onPhoneChange} size="small" fullWidth />
            <TextField key="password" label="Password" type="password" value={password} onChange={onPasswordChange} size="small" fullWidth />
            <Button variant="contained" onClick={onSubmit} fullWidth>Sign Up</Button>
        </Stack>
    );
}
