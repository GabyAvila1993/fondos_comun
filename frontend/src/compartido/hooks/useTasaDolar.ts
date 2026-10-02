import { useState, useEffect } from 'react';

export function useTasaDolar(defaultRate: number = 1000) {
  const [fiatToMonRate, setFiatToMonRate] = useState(defaultRate);

  useEffect(() => {
    fetch("https://dolarapi.com/v1/dolares/cripto")
      .then(res => res.json())
      .then(data => {
        if (data.venta) setFiatToMonRate(data.venta);
      })
      .catch(console.error);
  }, []);

  return fiatToMonRate;
}
