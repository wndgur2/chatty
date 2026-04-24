import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  function createHost(
    request: Partial<Request>,
    response: Partial<Response>,
  ): ArgumentsHost {
    return {
      switchToHttp: () => ({
        getResponse: () => response as Response,
        getRequest: () => request as Request,
      }),
    } as ArgumentsHost;
  }

  it('maps HttpException with string body to status and message', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = createHost(
      { url: '/api/test' },
      { status: status as unknown as Response['status'] },
    );

    filter.catch(new HttpException('Bad', HttpStatus.BAD_REQUEST), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: '/api/test',
        message: 'Bad',
      }),
    );
    const rawCalls = json.mock.calls as unknown as Array<
      [{ timestamp: string }]
    >;
    const firstPayload = rawCalls[0][0];
    expect(firstPayload.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('maps HttpException with object message', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = createHost(
      { url: '/x' },
      { status: status as unknown as Response['status'] },
    );

    filter.catch(
      new HttpException(
        { message: ['a', 'b'] },
        HttpStatus.UNPROCESSABLE_ENTITY,
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        message: ['a', 'b'],
      }),
    );
  });

  it('uses Unexpected error when HttpException object omits message', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = createHost(
      { url: '/y' },
      { status: status as unknown as Response['status'] },
    );

    filter.catch(
      new HttpException({ message: undefined }, HttpStatus.BAD_REQUEST),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Unexpected error',
      }),
    );
  });

  it('returns 500 and default message for unknown errors', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = createHost(
      { url: '/fail' },
      { status: status as unknown as Response['status'] },
    );

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Unexpected error',
      }),
    );
  });
});
