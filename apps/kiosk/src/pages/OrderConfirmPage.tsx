import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const RESET_SECONDS = 15;

export function OrderConfirmPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(RESET_SECONDS);

  useEffect(() => {
    const iv = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(iv);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center px-8">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle size={56} className="text-green-600" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>

      <p className="text-xl text-gray-600 mb-2">
        Order <span className="font-mono font-bold text-brand-700">#{orderId?.slice(0, 8).toUpperCase()}</span>
      </p>

      <p className="text-lg text-gray-500 mb-8">
        Please proceed to the counter to pay and pick up your order.
        <br />
        Have your ID ready.
      </p>

      <div className="bg-gray-100 rounded-2xl px-8 py-4">
        <p className="text-sm text-gray-400">Screen resets in</p>
        <p className="text-4xl font-bold text-gray-900 tabular-nums">{countdown}s</p>
      </div>

      <button onClick={() => navigate('/')}
        className="mt-8 text-brand-600 hover:text-brand-700 font-semibold text-lg">
        Start New Order
      </button>
    </div>
  );
}
