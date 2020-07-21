import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // TODO

    const customer = await this.customersRepository.findById(customer_id);
    if (!customer)
      throw new AppError(
        'Invalid user! You must provide a valid user to order',
      );

    const productIds = products.map(product => {
      return { id: product.id };
    });

    const validProducts = await this.productsRepository.findAllById(productIds);

    if (!validProducts || !validProducts.length)
      throw new AppError('Invalid products!, You must provide valid products');

    const productsFilter = validProducts.map(p => {
      const productQuantity = products.find(
        sameProduct => sameProduct.id === p.id,
      );

      return {
        product_id: p.id,
        price: p.price,
        quantity: productQuantity?.quantity || 0,
      };
    });

    await this.productsRepository.updateQuantity(products);

    const order = await this.ordersRepository.create({
      customer,
      products: productsFilter,
    });

    return order;
  }
}

export default CreateOrderService;
