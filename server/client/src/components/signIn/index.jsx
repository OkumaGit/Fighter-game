import { useState } from 'react';
import { TextField, Button, Stack } from '@mui/material';
import { login } from '../../services/domainRequest/auth';
import { setLoginSession } from '../../services/authService';

export default function SignIn({ setIsLoggedIn }) {
    const [email, setEmail] = useState();
    const [password, setPassword] = useState();

    const onEmailChange = (event) => {
        setEmail(event.target.value);
    }

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    }

    const onSubmit = async () => {
        const data = await login({ email, password });
        if (data && !data.error) {
            setLoginSession(data);
            setIsLoggedIn(true);
        }
    };

    return (
        <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
                label="Email"
                type="email"
                value={email}
                onChange={onEmailChange}
                size="small"
                fullWidth
            />
            <TextField
                label="Password"
                type="password"
                value={password}
                onChange={onPasswordChange}
                size="small"
                fullWidth
            />
            <Button onClick={onSubmit} variant="contained"  fullWidth>
                Sign In
            </Button>
        </Stack>
    );
}
