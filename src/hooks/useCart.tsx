import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {

    try {



      const verificationProduct = [...cart]
      const productExistsInCart = verificationProduct.find(product => product.id === productId)
      console.log(productExistsInCart)


      if (productExistsInCart) {
        await api.get(`stock/${productId}`).then((response) => {
          if (response.data.amount <= productExistsInCart.amount) {
            toast.error('Quantidade solicitada fora de estoque');
            return
          } else {
            const newCart = [...cart]
            newCart.forEach(item => {
              if (item.id === productId) {
                item.amount++
              }
            })

            setCart(newCart)
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          }
        })
      } else {
        await api.get(`products/${productId}`).then(res => { setCart([...cart, { ...res.data, amount: 1 }]); localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, { ...res.data, amount: 1 }])) })

      }

    } catch {
      toast.error('Erro na adição do produto')
    }


  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(cart => cart.id !== productId)

      if (newCart.length === cart.length) {
        toast.error('Erro na remoção do produto');
      } else {
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }

  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      await api.get(`stock/${productId}`).then((response) => {
        if (response.data.amount < amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        } else if (amount < 1) {
          return
        } else {
          const newCart = [...cart]
          newCart.forEach(item => {
            if (item.id === productId) {
              item.amount = + amount
            }
          })

          setCart(newCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        }
      })
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
