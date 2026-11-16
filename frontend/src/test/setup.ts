import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom tidak membersihkan DOM antar uji; tanpa ini hasil satu uji menempel ke
// uji berikutnya dan pencarian elemen jadi ambigu.
afterEach(cleanup);
