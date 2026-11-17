// Whitespace does not count as a special character.
export function isStrongPassword(password) {
    return typeof password === 'string' && password.length >= 8 &&
        /[0-9]/.test(password) && /[^\p{L}\p{N}\s]/u.test(password);
}
