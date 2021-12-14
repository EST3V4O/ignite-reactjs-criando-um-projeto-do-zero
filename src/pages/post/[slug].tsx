/* eslint-disable react/no-danger */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Prismic from '@prismicio/client';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { UtterancesComments } from '../../components/UtterancesComments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  nextPost: Post | undefined;
  prevPost: Post | undefined;
}

export default function Post({
  post,
  nextPost,
  prevPost,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const amountWords = post.data.content.reduce((acumulador, content) => {
    const words = RichText.asText(content.body).split(' ').length;

    return acumulador + words;
  }, 0);

  const readingTime = Math.ceil(amountWords / 200);

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>

      <main className={commonStyles.contentFullWith}>
        <article className={styles.contentContainer}>
          <img src={post.data.banner.url} alt={post.data.title} />
          <section
            className={`${commonStyles.contentContainer} ${styles.content}`}
          >
            <h1>{post.data.title}</h1>
            <section className={styles.contentInformation}>
              <div className={styles.contentHeader}>
                <div>
                  <FiCalendar />
                  <time>
                    {format(new Date(post.first_publication_date), 'd MMM Y', {
                      locale: ptBR,
                    })}
                  </time>
                </div>
                <div>
                  <FiUser />
                  <span>{post.data.author}</span>
                </div>
                <div>
                  <FiClock />
                  <span>{readingTime} min</span>
                </div>
              </div>
              <span>
                * editado em{' '}
                {format(
                  new Date(post.first_publication_date),
                  "d MMM Y', às' k':'mm",
                  {
                    locale: ptBR,
                  }
                )}
              </span>
            </section>
            {post.data.content.map(({ heading, body }) => (
              <div key={heading}>
                <h2>{heading}</h2>
                <div
                  dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}
                />
              </div>
            ))}
          </section>
        </article>
        <section
          className={`${commonStyles.contentContainer} ${styles.otherPosts}`}
        >
          {prevPost ? (
            <div>
              <h3>{prevPost.data.title}</h3>
              <Link href={`/post/${prevPost.uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          ) : (
            <div />
          )}
          {nextPost ? (
            <div>
              <h3>{nextPost.data.title}</h3>
              <Link href={`/post/${nextPost.uid}`}>
                <a>Proximo post</a>
              </Link>
            </div>
          ) : (
            <div />
          )}
        </section>
        <UtterancesComments />
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 100,
    }
  );

  return {
    paths: posts.results.map(post => ({
      params: { slug: post.uid },
    })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date]',
    }
  );

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      nextPost: nextPost.results[0] || null,
      prevPost: prevPost.results[0] || null,
    },
    revalidate: 60 * 60 * 24, // 24 horas
  };
};
