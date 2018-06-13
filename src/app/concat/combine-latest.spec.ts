import { of, concat, combineLatest, Observable } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';

describe('concat', () => {
  it('should concat', () => {
    const obs = [of({ test: 'test' }), of({ test: 'test1' }), of({ test1: 'test1' })];

    combineLatest(...obs)
      .pipe(map((res: object[]) => res.reduce((agg, current) => ({ ...agg, ...current }), {})))
      .subscribe(obj => {
        console.log(obj);
        expect(obj).toEqual({ test: 'test1', test1: 'test1' });
      });
  });
});
